import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const { method } = req

    if (method === 'POST') {
      const url = new URL(req.url)
      const path = url.pathname

      if (path === '/create-payment-intent') {
        const { amount, currency = 'usd', metadata = {} } = await req.json()

        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            metadata,
            automatic_payment_methods: {
              enabled: true,
            },
          })

          return new Response(
            JSON.stringify({
              payment_intent_id: paymentIntent.id,
              client_secret: paymentIntent.client_secret,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }
      }

      if (path === '/confirm-payment') {
        const { payment_intent_id } = await req.json()

        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

          return new Response(
            JSON.stringify({
              status: paymentIntent.status,
              payment_intent: paymentIntent,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }
      }

      if (path === '/refund') {
        const { payment_intent_id, reason = 'requested_by_customer' } = await req.json()

        try {
          const refund = await stripe.refunds.create({
            payment_intent: payment_intent_id,
            reason,
          })

          return new Response(
            JSON.stringify({
              refund_id: refund.id,
              status: refund.status,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }
      }

      if (path === '/create-customer') {
        const { email, name, metadata = {} } = await req.json()

        try {
          const customer = await stripe.customers.create({
            email,
            name,
            metadata,
          })

          return new Response(
            JSON.stringify({
              customer_id: customer.id,
              customer: customer,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }
      }
    }

    if (method === 'GET') {
      const url = new URL(req.url)
      const path = url.pathname

      if (path === '/payment-status') {
        const payment_intent_id = url.searchParams.get('payment_intent_id')

        if (!payment_intent_id) {
          return new Response(
            JSON.stringify({ error: 'Payment intent ID is required' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }

        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

          return new Response(
            JSON.stringify({
              status: paymentIntent.status,
              payment_intent: paymentIntent,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
