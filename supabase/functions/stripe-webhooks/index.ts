import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const sig = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    if (!sig || !webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe signature or webhook secret' }),
        { status: 400 }
      )
    }

    const body = await req.text()
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err) {
      console.log(`Webhook signature verification failed:`, err.message)
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400 }
      )
    }

    console.log(`Processing webhook event: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        console.log(`Payment succeeded: ${paymentIntent.id}`)
        
        // Update payment status in database
        await supabaseClient
          .from('payment_attempts')
          .update({ 
            status: 'succeeded',
            updated_at: new Date().toISOString()
          })
          .eq('payment_intent_id', paymentIntent.id)

        // Update invoice status
        await supabaseClient
          .from('invoices')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        // Update booking status if applicable
        const { data: invoice } = await supabaseClient
          .from('invoices')
          .select('booking_id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (invoice?.booking_id) {
          await supabaseClient
            .from('bookings')
            .update({ 
              status: 'confirmed',
              updated_at: new Date().toISOString()
            })
            .eq('id', invoice.booking_id)
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        console.log(`Payment failed: ${paymentIntent.id}`)
        
        // Update payment status in database
        await supabaseClient
          .from('payment_attempts')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('payment_intent_id', paymentIntent.id)

        // Update invoice status
        await supabaseClient
          .from('invoices')
          .update({ 
            status: 'failed',
            stripe_payment_intent_id: paymentIntent.id
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        break
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        console.log(`Payment canceled: ${paymentIntent.id}`)
        
        // Update payment status in database
        await supabaseClient
          .from('payment_attempts')
          .update({ 
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('payment_intent_id', paymentIntent.id)

        break
      }

      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge
        
        console.log(`Charge succeeded: ${charge.id}`)
        
        // Record payment details
        const { data: paymentAttempt } = await supabaseClient
          .from('payment_attempts')
          .select('id')
          .eq('payment_intent_id', charge.payment_intent)
          .single()

        if (paymentAttempt) {
          await supabaseClient.rpc('record_payment_details', [
            paymentAttempt.id,
            charge.payment_intent as string,
            charge.payment_method as string,
            charge.id,
            charge.customer as string,
            charge.amount / 100, // Convert from cents
            charge.currency,
            charge.outcome?.seller_message || 'succeeded',
            charge.outcome?.network_status || 'approved_by_network',
            null,
            charge.outcome?.risk_level || 'normal',
            charge.outcome?.risk_score || 0,
            JSON.stringify(charge.outcome?.risk_score || {}),
            JSON.stringify(charge),
          ])
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        console.log(`Invoice payment succeeded: ${invoice.id}`)
        
        // Handle subscription payments if you have them
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        console.log(`Invoice payment failed: ${invoice.id}`)
        
        // Handle failed subscription payments
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        console.log(`Subscription ${event.type}: ${subscription.id}`)
        
        // Handle subscription events if you have them
        break
      }

      default: {
        console.log(`Unhandled event type: ${event.type}`)
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200,
        headers: corsHeaders
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: corsHeaders
      }
    )
  }
})
