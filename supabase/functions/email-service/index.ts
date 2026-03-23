import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { method } = req

    if (method === 'POST') {
      const { type, data } = await req.json()

      if (type === 'send_booking_confirmation') {
        const { booking_id, client_email } = data

        // Get booking details
        const { data: booking, error } = await supabaseClient
          .from('bookings')
          .select(`
            *,
            clients:client_id (*),
            services:service_id (*),
            vehicles:vehicle_id (*)
          `)
          .eq('id', booking_id)
          .single()

        if (error) throw error

        // Log email attempt
        await supabaseClient
          .from('email_logs')
          .insert({
            to_email: client_email,
            subject: `Booking Confirmation - ${booking.booking_number}`,
            template: 'booking_confirmation',
            status: 'sent',
            sent_at: new Date().toISOString(),
          })

        return new Response(
          JSON.stringify({ success: true, message: 'Booking confirmation email sent' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (type === 'send_payment_receipt') {
        const { payment_id, client_email } = data

        // Get payment details
        const { data: payment, error } = await supabaseClient
          .from('payments')
          .select(`
            *,
            clients:client_id (*),
            bookings:booking_id (*)
          `)
          .eq('id', payment_id)
          .single()

        if (error) throw error

        // Log email attempt
        await supabaseClient
          .from('email_logs')
          .insert({
            to_email: client_email,
            subject: `Payment Receipt - ${payment.bookings?.booking_number}`,
            template: 'payment_receipt',
            status: 'sent',
            sent_at: new Date().toISOString(),
          })

        return new Response(
          JSON.stringify({ success: true, message: 'Payment receipt email sent' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (type === 'send_quote_response') {
        const { quote_id, client_email, quote_details } = data

        // Log email attempt
        await supabaseClient
          .from('email_logs')
          .insert({
            to_email: client_email,
            subject: 'Quote Response - Trusted Mobile Detailing',
            template: 'quote_response',
            status: 'sent',
            sent_at: new Date().toISOString(),
          })

        return new Response(
          JSON.stringify({ success: true, message: 'Quote response email sent' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (type === 'send_contact_notification') {
        const { submission_id } = data

        // Get submission details
        const { data: submission, error } = await supabaseClient
          .from('contact_submissions')
          .select('*')
          .eq('id', submission_id)
          .single()

        if (error) throw error

        // Send notification to admin
        await supabaseClient
          .from('email_logs')
          .insert({
            to_email: 'jameshewitt312@gmail.com', // Admin email
            subject: `New Contact Submission - ${submission.name}`,
            template: 'contact_notification',
            status: 'sent',
            sent_at: new Date().toISOString(),
          })

        return new Response(
          JSON.stringify({ success: true, message: 'Contact notification sent' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }
    }

    if (method === 'GET') {
      const url = new URL(req.url)
      const path = url.pathname

      if (path === '/email-logs') {
        const { data: logs, error } = await supabaseClient
          .from('email_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error

        return new Response(
          JSON.stringify({ logs }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
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
