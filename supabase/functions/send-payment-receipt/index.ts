import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    }

    const { toEmail, subject, html, invoiceData, paymentIntent } = await req.json()

    if (!toEmail || !subject || !html) {
      return new Response('Missing required fields: toEmail, subject, html', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    console.log('Sending payment receipt email to:', toEmail)

    // Use Resend API for email sending
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment')
      return new Response('Email service not configured', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Trusted Mobile Detailing <noreply@trustedmobiledetailing.com>',
        to: [toEmail],
        subject: subject,
        html: html,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Email send failed:', errorData)
      return new Response('Failed to send email', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult)

    // Log payment details for tracking
    console.log('Payment receipt sent:', {
      invoiceNumber: invoiceData?.invoice_number,
      customerEmail: toEmail,
      paymentIntentId: paymentIntent?.id,
      amount: invoiceData?.total,
      timestamp: new Date().toISOString()
    })

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Payment receipt sent successfully',
      emailId: emailResult.id
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error in send-payment-receipt function:', error)
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
