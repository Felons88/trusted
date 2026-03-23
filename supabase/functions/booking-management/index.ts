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
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { method } = req

    if (method === 'POST') {
      const { type, data } = await req.json()

      if (type === 'contact_submission') {
        const { name, email, phone, message } = data

        const { data: submission, error } = await supabaseClient
          .from('contact_submissions')
          .insert({
            name,
            email,
            phone,
            message,
            is_read: false,
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, submission }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (type === 'quote_request') {
        const { 
          full_name, 
          email, 
          phone, 
          vehicle_year, 
          vehicle_make, 
          vehicle_model, 
          vehicle_size, 
          service_type, 
          add_ons, 
          preferred_date, 
          preferred_time, 
          address, 
          notes 
        } = data

        const { data: quote, error } = await supabaseClient
          .from('quote_requests')
          .insert({
            full_name,
            email,
            phone,
            vehicle_year,
            vehicle_make,
            vehicle_model,
            vehicle_size,
            service_type,
            add_ons,
            preferred_date,
            preferred_time,
            address,
            notes,
            status: 'new',
            is_read: false,
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, quote }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (type === 'create_booking') {
        const { 
          client_id, 
          vehicle_id, 
          service_id, 
          preferred_date, 
          preferred_time, 
          service_address, 
          service_city, 
          service_state, 
          service_zip, 
          service_type, 
          vehicle_size, 
          subtotal, 
          tax, 
          total, 
          notes,
          add_ons 
        } = data

        // Start a transaction
        const { data: booking, error: bookingError } = await supabaseClient
          .from('bookings')
          .insert({
            client_id,
            vehicle_id,
            service_id,
            preferred_date,
            preferred_time,
            service_address,
            service_city,
            service_state,
            service_zip,
            service_type,
            vehicle_size,
            subtotal,
            tax,
            total,
            notes,
            status: 'pending',
          })
          .select()
          .single()

        if (bookingError) throw bookingError

        // Add booking add-ons if provided
        if (add_ons && add_ons.length > 0) {
          const bookingAddOns = add_ons.map(add_on => ({
            booking_id: booking.id,
            add_on_id: add_on.id,
            quantity: add_on.quantity || 1,
            price: add_on.price,
          }))

          const { error: addOnsError } = await supabaseClient
            .from('booking_add_ons')
            .insert(bookingAddOns)

          if (addOnsError) throw addOnsError
        }

        return new Response(
          JSON.stringify({ success: true, booking }),
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

      if (path === '/bookings') {
        const { data: bookings, error } = await supabaseClient
          .from('bookings')
          .select(`
            *,
            clients:client_id (*),
            vehicles:vehicle_id (*),
            services:service_id (*),
            booking_add_ons (*, add_ons:add_on_id (*))
          `)
          .order('created_at', { ascending: false })

        if (error) throw error

        return new Response(
          JSON.stringify({ bookings }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (path === '/services') {
        const { data: services, error } = await supabaseClient
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name')

        if (error) throw error

        return new Response(
          JSON.stringify({ services }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (path === '/add-ons') {
        const { data: addOns, error } = await supabaseClient
          .from('add_ons')
          .select('*')
          .eq('is_active', true)
          .order('name')

        if (error) throw error

        return new Response(
          JSON.stringify({ add_ons }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (path === '/contact-submissions') {
        const { data: submissions, error } = await supabaseClient
          .from('contact_submissions')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        return new Response(
          JSON.stringify({ submissions }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (path === '/quote-requests') {
        const { data: quotes, error } = await supabaseClient
          .from('quote_requests')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        return new Response(
          JSON.stringify({ quotes }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }
    }

    if (method === 'PUT') {
      const { type, data } = await req.json()

      if (type === 'update_booking') {
        const { id, status, admin_notes } = data

        const { data: booking, error } = await supabaseClient
          .from('bookings')
          .update({
            status,
            admin_notes,
            updated_at: new Date().toISOString(),
            completed_at: status === 'completed' ? new Date().toISOString() : null,
          })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, booking }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (type === 'mark_contact_read') {
        const { id } = data

        const { error } = await supabaseClient
          .from('contact_submissions')
          .update({ is_read: true })
          .eq('id', id)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (type === 'mark_quote_read') {
        const { id } = data

        const { error } = await supabaseClient
          .from('quote_requests')
          .update({ is_read: true })
          .eq('id', id)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
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
