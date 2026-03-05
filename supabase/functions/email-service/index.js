// Email Service Edge Function using Resend
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
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const businessEmail = Deno.env.get('BUSINESS_EMAIL') || 'info@trustedmobiledetailing.com'

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Resend API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Send booking confirmation
    if (method === 'POST' && pathname === '/booking-confirmation') {
      const { customerEmail, bookingDetails } = body

      if (!customerEmail || !bookingDetails) {
        return new Response(
          JSON.stringify({ error: 'Customer email and booking details are required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      try {
        const emailContent = generateBookingConfirmationTemplate(bookingDetails)

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: businessEmail,
            to: [customerEmail],
            subject: `Booking Confirmation - ${bookingDetails.serviceType}`,
            html: emailContent
          })
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }

        const result = await response.json()

        return new Response(
          JSON.stringify({ success: true, messageId: result.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } catch (error) {
        console.error('Send booking confirmation error:', error)
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to send booking confirmation' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Send appointment reminder
    if (method === 'POST' && pathname === '/appointment-reminder') {
      const { customerEmail, bookingDetails } = body

      if (!customerEmail || !bookingDetails) {
        return new Response(
          JSON.stringify({ error: 'Customer email and booking details are required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      try {
        const emailContent = generateReminderTemplate(bookingDetails)

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: businessEmail,
            to: [customerEmail],
            subject: `Appointment Reminder - ${bookingDetails.date} at ${bookingDetails.time}`,
            html: emailContent
          })
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }

        const result = await response.json()

        return new Response(
          JSON.stringify({ success: true, messageId: result.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } catch (error) {
        console.error('Send appointment reminder error:', error)
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to send appointment reminder' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Send payment receipt
    if (method === 'POST' && pathname === '/payment-receipt') {
      const { customerEmail, paymentDetails, bookingDetails } = body

      if (!customerEmail || !paymentDetails || !bookingDetails) {
        return new Response(
          JSON.stringify({ error: 'Customer email, payment details, and booking details are required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      try {
        const emailContent = generateReceiptTemplate(paymentDetails, bookingDetails)

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: businessEmail,
            to: [customerEmail],
            subject: `Payment Receipt - Order #${paymentDetails.orderId}`,
            html: emailContent
          })
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }

        const result = await response.json()

        return new Response(
          JSON.stringify({ success: true, messageId: result.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } catch (error) {
        console.error('Send payment receipt error:', error)
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to send payment receipt' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Send welcome email
    if (method === 'POST' && pathname === '/welcome-email') {
      const { customerEmail, customerDetails } = body

      if (!customerEmail || !customerDetails) {
        return new Response(
          JSON.stringify({ error: 'Customer email and details are required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      try {
        const emailContent = generateWelcomeTemplate(customerDetails)

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: businessEmail,
            to: [customerEmail],
            subject: 'Welcome to Trusted Mobile Detailing!',
            html: emailContent
          })
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }

        const result = await response.json()

        return new Response(
          JSON.stringify({ success: true, messageId: result.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } catch (error) {
        console.error('Send welcome email error:', error)
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to send welcome email' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Send service completion email
    if (method === 'POST' && pathname === '/service-completion') {
      const { customerEmail, bookingDetails, beforeAfterPhotos } = body

      if (!customerEmail || !bookingDetails) {
        return new Response(
          JSON.stringify({ error: 'Customer email and booking details are required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      try {
        const emailContent = generateServiceCompletionTemplate(bookingDetails, beforeAfterPhotos || [])

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: businessEmail,
            to: [customerEmail],
            subject: `Service Completed - ${bookingDetails.serviceType}`,
            html: emailContent
          })
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }

        const result = await response.json()

        return new Response(
          JSON.stringify({ success: true, messageId: result.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } catch (error) {
        console.error('Send service completion email error:', error)
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to send service completion email' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )

  } catch (error) {
    console.error('Email service error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Email Templates
function generateBookingConfirmationTemplate(booking) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
        <h1>Booking Confirmation</h1>
        <p>Trusted Mobile Detailing</p>
      </div>
      <div style="padding: 20px;">
        <h2>Service Details</h2>
        <p><strong>Service:</strong> ${booking.serviceType}</p>
        <p><strong>Date:</strong> ${booking.date}</p>
        <p><strong>Time:</strong> ${booking.time}</p>
        <p><strong>Location:</strong> ${booking.address}</p>
        <p><strong>Vehicle:</strong> ${booking.vehicleYear} ${booking.vehicleMake} ${booking.vehicleModel}</p>
        <p><strong>Total Amount:</strong> $${booking.totalAmount}</p>
        
        <h3>What's Next?</h3>
        <ul>
          <li>We'll arrive at your location at the scheduled time</li>
          <li>Please ensure the vehicle is accessible</li>
          <li>Payment will be processed after service completion</li>
        </ul>
        
        <p>Questions? Reply to this email or call us at (555) 123-4567</p>
      </div>
      <div style="background: #f5f5f5; padding: 20px; text-align: center;">
        <p>Thank you for choosing Trusted Mobile Detailing!</p>
      </div>
    </div>
  `
}

function generateReminderTemplate(booking) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
        <h1>Appointment Reminder</h1>
        <p>Trusted Mobile Detailing</p>
      </div>
      <div style="padding: 20px;">
        <h2>Your Appointment is Tomorrow!</h2>
        <p><strong>Service:</strong> ${booking.serviceType}</p>
        <p><strong>Date:</strong> ${booking.date}</p>
        <p><strong>Time:</strong> ${booking.time}</p>
        <p><strong>Location:</strong> ${booking.address}</p>
        
        <h3>Preparation Checklist</h3>
        <ul>
          <li>Remove personal items from the vehicle</li>
          <li>Ensure vehicle is parked in a suitable location</li>
          <li>Have keys available for our technician</li>
        </ul>
        
        <p>We look forward to serving you!</p>
      </div>
    </div>
  `
}

function generateReceiptTemplate(payment, booking) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
        <h1>Payment Receipt</h1>
        <p>Order #${payment.orderId}</p>
      </div>
      <div style="padding: 20px;">
        <h2>Payment Details</h2>
        <p><strong>Amount:</strong> $${payment.amount}</p>
        <p><strong>Payment Method:</strong> ${payment.method}</p>
        <p><strong>Date:</strong> ${payment.date}</p>
        <p><strong>Status:</strong> ${payment.status}</p>
        
        <h3>Service Details</h3>
        <p><strong>Service:</strong> ${booking.serviceType}</p>
        <p><strong>Date:</strong> ${booking.date}</p>
        <p><strong>Vehicle:</strong> ${booking.vehicleYear} ${booking.vehicleMake} ${booking.vehicleModel}</p>
        
        <p>Thank you for your business!</p>
      </div>
    </div>
  `
}

function generateWelcomeTemplate(customer) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
        <h1>Welcome!</h1>
        <p>Trusted Mobile Detailing</p>
      </div>
      <div style="padding: 20px;">
        <h2>Welcome to Trusted Mobile Detailing!</h2>
        <p>Hi ${customer.firstName},</p>
        <p>Thank you for choosing us for your vehicle detailing needs. We're excited to serve you!</p>
        
        <h3>What We Offer</h3>
        <ul>
          <li>Professional mobile detailing</li>
          <li>Convenient at-your-location service</li>
          <li>Eco-friendly products</li>
          <li>Satisfaction guaranteed</li>
        </ul>
        
        <p>Book your first service and receive 10% off!</p>
        <p>Use code: WELCOME10</p>
      </div>
    </div>
  `
}

function generateServiceCompletionTemplate(booking, photos) {
  const photoGallery = photos.map(photo => 
    `<img src="${photo.url}" alt="Service photo" style="max-width: 100%; height: auto; margin: 10px 0;">`
  ).join('')

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
        <h1>Service Completed!</h1>
        <p>Trusted Mobile Detailing</p>
      </div>
      <div style="padding: 20px;">
        <h2>Your ${booking.serviceType} is Complete</h2>
        <p>We hope you're happy with the results! Here are some photos of your freshly detailed vehicle:</p>
        
        <div style="margin: 20px 0;">
          ${photoGallery}
        </div>
        
        <h3>Next Steps</h3>
        <ul>
          <li>Payment has been processed</li>
          <li>Please leave a review if you're satisfied</li>
          <li>Schedule your next detailing service</li>
        </ul>
        
        <p>Questions? Reply to this email!</p>
      </div>
    </div>
  `
}
