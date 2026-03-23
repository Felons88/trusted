import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Method not allowed'
      }), { 
        status: 405, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      })
    }

    const { amount, currency, metadata } = await req.json()

    if (!amount || !currency) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields: amount, currency'
      }), { 
        status: 400, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      })
    }

    console.log('Creating payment intent:', { amount, currency, metadata })

    // Use Stripe API to create payment intent
    const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY')
    
    if (!stripeApiKey) {
      console.error('STRIPE_SECRET_KEY not found in environment')
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Stripe not configured'
      }), { 
        status: 500, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      })
    }

    // Create payment intent with proper parameters
    const paymentIntentData = {
      amount: amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: metadata
    }

    const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency: currency,
        'automatic_payment_methods[enabled]': 'true',
        'automatic_payment_methods[allow_redirects]': 'never',
        ...Object.entries(metadata).reduce((params, [key, value]) => {
          params[`metadata[${key}]`] = String(value)
          return params
        }, {} as Record<string, string>),
      }),
    })

    if (!paymentIntentResponse.ok) {
      const errorData = await paymentIntentResponse.text()
      console.error('Stripe API error:', errorData)
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to create payment intent',
        details: errorData
      }), { 
        status: 500, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      })
    }

    const paymentIntent = await paymentIntentResponse.json()
    console.log('Payment intent created successfully:', paymentIntent.id)

    return new Response(JSON.stringify({ 
      success: true, 
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })

  } catch (error: any) {
    console.error('Error in create-payment-intent function:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
})
