// Stripe Payment Processing Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const method = req.method
    const pathname = url.pathname
    const body = await req.json()

    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe secret key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create payment intent
    if (method === 'POST' && pathname === '/create-payment-intent') {
      const { amount, currency = 'usd', metadata } = body

      if (!amount) {
        return new Response(
          JSON.stringify({ error: 'Amount is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      try {
        // Call Stripe API directly
        const response = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            amount: Math.round(amount * 100),
            currency,
            'automatic_payment_methods[enabled]': 'true',
            'metadata[bookingId]': metadata?.bookingId || '',
            'metadata[customerEmail]': metadata?.customerEmail || '',
          })
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }

        const paymentIntent = await response.json()

        return new Response(
          JSON.stringify({ clientSecret: paymentIntent.client_secret }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } catch (error) {
        console.error('Stripe create payment intent error:', error)
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to create payment intent' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Process refund
    if (method === 'POST' && pathname === '/refund') {
      const { paymentIntentId, amount, reason } = body

      if (!paymentIntentId) {
        return new Response(
          JSON.stringify({ error: 'Payment intent ID is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      try {
        const refundParams = {
          payment_intent: paymentIntentId,
          reason: reason || 'requested_by_customer',
        }

        if (amount) {
          refundParams.amount = Math.round(amount * 100)
        }

        const response = await fetch('https://api.stripe.com/v1/refunds', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(refundParams)
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }

        const refund = await response.json()

        return new Response(
          JSON.stringify(refund),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } catch (error) {
        console.error('Stripe refund error:', error)
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to process refund' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Get payment status
    if (method === 'GET' && pathname.startsWith('/payment-status/')) {
      const paymentIntentId = pathname.split('/payment-status/')[1]

      if (!paymentIntentId) {
        return new Response(
          JSON.stringify({ error: 'Payment intent ID is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      try {
        const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          }
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }

        const paymentIntent = await response.json()

        return new Response(
          JSON.stringify({
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            metadata: paymentIntent.metadata,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } catch (error) {
        console.error('Stripe get payment status error:', error)
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to get payment status' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Create customer
    if (method === 'POST' && pathname === '/create-customer') {
      const { email, name, phone } = body

      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      try {
        const customerParams = {
          email,
        }

        if (name) customerParams.name = name
        if (phone) customerParams.phone = phone

        const response = await fetch('https://api.stripe.com/v1/customers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(customerParams)
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }

        const customer = await response.json()

        return new Response(
          JSON.stringify(customer),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } catch (error) {
        console.error('Stripe create customer error:', error)
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to create customer' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Handle webhook
    if (method === 'POST' && pathname === '/webhook') {
      const sig = req.headers.get('stripe-signature')
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

      if (!sig || !webhookSecret) {
        return new Response(
          JSON.stringify({ error: 'Webhook signature or secret not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      try {
        const body = await req.text()
        
        // For now, just log the webhook event
        // In production, you'd verify the signature and process events
        console.log('Webhook received:', sig, body)

        return new Response(
          JSON.stringify({ received: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } catch (error) {
        console.error('Webhook error:', error)
        return new Response(
          JSON.stringify({ error: error.message || 'Webhook processing failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )

  } catch (error) {
    console.error('Stripe function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
