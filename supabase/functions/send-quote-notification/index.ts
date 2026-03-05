import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const OWNER_EMAIL = Deno.env.get('OWNER_EMAIL')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QuoteRequest {
  full_name: string
  email: string
  phone: string
  vehicle_year?: number
  vehicle_make?: string
  vehicle_model?: string
  vehicle_size: string
  service_type: string
  preferred_date?: string
  preferred_time?: string
  address: string
  notes?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const quoteData: QuoteRequest = await req.json()

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0B1C2D, #102A44); color: #fff; padding: 30px; text-align: center; }
            .header h1 { margin: 0; color: #1DB7E8; }
            .content { background: #f9f9f9; padding: 30px; }
            .detail-row { margin: 15px 0; padding: 10px; background: white; border-left: 3px solid #1DB7E8; }
            .label { font-weight: bold; color: #0B1C2D; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 New Quote Request</h1>
              <p>Trusted Mobile Detailing</p>
            </div>
            <div class="content">
              <h2>Customer Information</h2>
              <div class="detail-row">
                <span class="label">Name:</span> ${quoteData.full_name}
              </div>
              <div class="detail-row">
                <span class="label">Email:</span> ${quoteData.email}
              </div>
              <div class="detail-row">
                <span class="label">Phone:</span> ${quoteData.phone}
              </div>
              
              <h2>Vehicle Details</h2>
              <div class="detail-row">
                <span class="label">Vehicle:</span> ${quoteData.vehicle_year || 'N/A'} ${quoteData.vehicle_make || ''} ${quoteData.vehicle_model || ''}
              </div>
              <div class="detail-row">
                <span class="label">Size:</span> ${quoteData.vehicle_size.toUpperCase()}
              </div>
              
              <h2>Service Request</h2>
              <div class="detail-row">
                <span class="label">Service Type:</span> ${quoteData.service_type.toUpperCase()} Detail
              </div>
              <div class="detail-row">
                <span class="label">Preferred Date:</span> ${quoteData.preferred_date || 'Not specified'}
              </div>
              <div class="detail-row">
                <span class="label">Preferred Time:</span> ${quoteData.preferred_time || 'Not specified'}
              </div>
              <div class="detail-row">
                <span class="label">Service Address:</span> ${quoteData.address}
              </div>
              
              ${quoteData.notes ? `
                <h2>Additional Notes</h2>
                <div class="detail-row">
                  ${quoteData.notes}
                </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>This is an automated notification from Trusted Mobile Detailing</p>
              <p>Log in to your admin dashboard to respond to this quote request</p>
            </div>
          </div>
        </body>
      </html>
    `

    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0B1C2D, #102A44); color: #fff; padding: 30px; text-align: center; }
            .header h1 { margin: 0; color: #1DB7E8; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { background: #1DB7E8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Quote Request!</h1>
              <p>Trusted Mobile Detailing</p>
            </div>
            <div class="content">
              <p>Hi ${quoteData.full_name},</p>
              <p>Thank you for requesting a quote from Trusted Mobile Detailing! We've received your information and will get back to you within 24 hours with a customized quote.</p>
              
              <h3>Your Request Details:</h3>
              <p><strong>Service:</strong> ${quoteData.service_type.toUpperCase()} Detail</p>
              <p><strong>Vehicle:</strong> ${quoteData.vehicle_year || ''} ${quoteData.vehicle_make || ''} ${quoteData.vehicle_model || ''}</p>
              <p><strong>Location:</strong> ${quoteData.address}</p>
              
              <p>In the meantime, if you have any questions, feel free to reach out:</p>
              <p>📞 Phone: (123) 456-7890<br>
              📧 Email: info@trustedmobiledetailing.com</p>
              
              <p>We look forward to making your vehicle shine!</p>
              <p>Best regards,<br>
              <strong>Trusted Mobile Detailing Team</strong></p>
            </div>
            <div class="footer">
              <p>Trusted Mobile Detailing - Elk River, MN</p>
              <p>Professional Mobile Auto Detailing Services</p>
            </div>
          </div>
        </body>
      </html>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Trusted Mobile Detailing <noreply@trustedmobiledetailing.com>',
        to: [OWNER_EMAIL],
        subject: `New Quote Request from ${quoteData.full_name}`,
        html: emailHtml,
      }),
    })

    const customerRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Trusted Mobile Detailing <noreply@trustedmobiledetailing.com>',
        to: [quoteData.email],
        subject: 'Quote Request Received - Trusted Mobile Detailing',
        html: customerEmailHtml,
      }),
    })

    const data = await res.json()
    const customerData = await customerRes.json()

    return new Response(
      JSON.stringify({ success: true, owner: data, customer: customerData }),
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
})
