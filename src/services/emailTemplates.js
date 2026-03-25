// Complete email templates using the existing Supabase email edge function
export const emailTemplates = {
  // Booking Status Templates
  booking_confirmed: {
    subject: '🎉 Your Mobile Detailing Appointment is Confirmed!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #0B1C2D 0%, #1DB7E8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Trusted Mobile Detailing</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Appointment is Confirmed!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #0B1C2D; margin-bottom: 20px;">🎉 Great News! Your Booking is Confirmed</h2>
          
          <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1DB7E8;">
            <h3 style="margin: 0 0 15px 0; color: #0B1C2D;">Appointment Details:</h3>
            <p style="margin: 5px 0;"><strong>Booking Number:</strong> {{booking_number}}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {{preferred_date}}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> {{preferred_time}}</p>
            <p style="margin: 5px 0;"><strong>Service:</strong> {{service_name}}</p>
            <p style="margin: 5px 0;"><strong>Vehicle:</strong> {{vehicle_make}} {{vehicle_model}} ({{vehicle_year}})</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> {{service_location}}</p>
            <p style="margin: 5px 0;"><strong>Total:</strong> ${{total}}</p>
          </div>

          <h3 style="color: #0B1C2D; margin: 20px 0 10px 0;">What's Next?</h3>
          <ul style="color: #333; line-height: 1.6;">
            <li>We'll arrive 10-15 minutes before your scheduled time</li>
            <li>Please ensure your vehicle is accessible</li>
            <li>Have keys ready for our technician</li>
            <li>Payment can be made via card or cash upon completion</li>
          </ul>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>Need to make changes?</strong><br>
            Reply to this email or call us at least 24 hours before your appointment.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{booking_link}}" style="background: #1DB7E8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Your Booking</a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Trusted Mobile Detailing | Elk River, MN</p>
            <p style="margin: 5px 0;">Professional detailing that comes to you!</p>
          </div>
        </div>
      </div>
    `
  },

  booking_canceled: {
    subject: '❌ Your Mobile Detailing Appointment Has Been Canceled',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Trusted Mobile Detailing</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Booking Canceled</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #dc3545; margin-bottom: 20px;">❌ Your Booking Has Been Canceled</h2>
          
          <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin: 0 0 15px 0; color: #721c24;">Canceled Appointment:</h3>
            <p style="margin: 5px 0;"><strong>Booking Number:</strong> {{booking_number}}</p>
            <p style="margin: 5px 0;"><strong>Original Date:</strong> {{preferred_date}}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> {{preferred_time}}</p>
            <p style="margin: 5px 0;"><strong>Service:</strong> {{service_name}}</p>
            <p style="margin: 5px 0;"><strong>Vehicle:</strong> {{vehicle_make}} {{vehicle_model}}</p>
          </div>

          <p style="color: #333; line-height: 1.6;">We're sorry to see your booking canceled. If this was a mistake or you'd like to reschedule, please don't hesitate to contact us.</p>

          <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <p style="margin: 0; color: #0c5460;"><strong>Want to rebook?</strong><br>
            We'd be happy to help you schedule a new appointment at your convenience.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{quote_link}}" style="background: #1DB7E8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Book New Appointment</a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Trusted Mobile Detailing | Elk River, MN</p>
            <p style="margin: 5px 0;">Professional detailing that comes to you!</p>
          </div>
        </div>
      </div>
    `
  },

  booking_completed: {
    subject: '✅ Your Mobile Detailing Service is Complete!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Trusted Mobile Detailing</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Service Completed!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #28a745; margin-bottom: 20px;">✅ Your Vehicle Looks Amazing!</h2>
          
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin: 0 0 15px 0; color: #155724;">Service Details:</h3>
            <p style="margin: 5px 0;"><strong>Booking Number:</strong> {{booking_number}}</p>
            <p style="margin: 5px 0;"><strong>Service Date:</strong> {{preferred_date}}</p>
            <p style="margin: 5px 0;"><strong>Service:</strong> {{service_name}}</p>
            <p style="margin: 5px 0;"><strong>Vehicle:</strong> {{vehicle_make}} {{vehicle_model}}</p>
            <p style="margin: 5px 0;"><strong>Total:</strong> ${{total}}</p>
          </div>

          <h3 style="color: #0B1C2D; margin: 20px 0 10px 0;">What We Did:</h3>
          <ul style="color: #333; line-height: 1.6;">
            <li>Complete exterior wash and wax</li>
            <li>Interior deep cleaning and conditioning</li>
            <li>Tire and wheel detailing</li>
            <li>Window cleaning inside and out</li>
            <li>Final inspection and quality check</li>
          </ul>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>Payment Reminder:</strong><br>
            If you haven't already paid, please settle your balance. We accept cash and card payments.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{review_link}}" style="background: #ffc107; color: #212529; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">Leave a Review</a>
            <a href="{{booking_link}}" style="background: #1DB7E8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Receipt</a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Trusted Mobile Detailing | Elk River, MN</p>
            <p style="margin: 5px 0;">Thank you for your business! We hope to see you again soon.</p>
          </div>
        </div>
      </div>
    `
  },

  booking_pending_reminder: {
    subject: '📋 Action Required: Confirm Your Mobile Detailing Appointment',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Trusted Mobile Detailing</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Action Required</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #ff9800; margin-bottom: 20px;">📋 Please Confirm Your Appointment</h2>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">Pending Appointment:</h3>
            <p style="margin: 5px 0;"><strong>Booking Number:</strong> {{booking_number}}</p>
            <p style="margin: 5px 0;"><strong>Requested Date:</strong> {{preferred_date}}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> {{preferred_time}}</p>
            <p style="margin: 5px 0;"><strong>Service:</strong> {{service_name}}</p>
            <p style="margin: 5px 0;"><strong>Vehicle:</strong> {{vehicle_make}} {{vehicle_model}}</p>
            <p style="margin: 5px 0;"><strong>Estimated Total:</strong> ${{total}}</p>
          </div>

          <p style="color: #333; line-height: 1.6;">We've received your booking request, but we need you to confirm the appointment details to secure your spot.</p>

          <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <p style="margin: 0; color: #0c5460;"><strong>Why confirmation is needed:</strong><br>
            This helps us ensure we have the right time slot available and can prepare everything needed for your service.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{booking_link}}" style="background: #ffc107; color: #212529; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">Confirm Appointment</a>
            <a href="{{contact_link}}" style="background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Contact Us</a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Trusted Mobile Detailing | Elk River, MN</p>
            <p style="margin: 5px 0;">Please confirm within 24 hours to secure your appointment.</p>
          </div>
        </div>
      </div>
    `
  },

  // Quote Request Templates
  quote_received: {
    subject: '📝 We\'ve Received Your Quote Request - Trusted Mobile Detailing',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #1DB7E8 0%, #0B1C2D 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Trusted Mobile Detailing</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Quote Request Received</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #0B1C2D; margin-bottom: 20px;">📝 Thank You for Your Interest!</h2>
          
          <p style="color: #333; line-height: 1.6;">We've received your quote request and our team is reviewing it. We'll get back to you with a detailed quote within 24 hours.</p>

          <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1DB7E8;">
            <h3 style="margin: 0 0 15px 0; color: #0B1C2D;">What Happens Next:</h3>
            <ol style="color: #333; line-height: 1.6; padding-left: 20px;">
              <li>We review your service requirements</li>
              <li>We prepare a detailed quote based on your needs</li>
              <li>We email you the quote within 24 hours</li>
              <li>You can book directly from the quote email</li>
            </ol>
          </div>

          <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;"><strong>Need it faster?</strong><br>
            Call us directly at <strong>612-123-4567</strong> for immediate assistance.</p>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Trusted Mobile Detailing | Elk River, MN</p>
            <p style="margin: 5px 0;">Professional detailing that comes to you!</p>
          </div>
        </div>
      </div>
    `
  },

  quote_ready: {
    subject: '💰 Your Mobile Detailing Quote is Ready!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Trusted Mobile Detailing</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Quote is Ready!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #28a745; margin-bottom: 20px;">💰 Great News! Your Quote is Ready</h2>
          
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin: 0 0 15px 0; color: #155724;">Quote Details:</h3>
            <p style="margin: 5px 0;"><strong>Quote Number:</strong> {{quote_number}}</p>
            <p style="margin: 5px 0;"><strong>Services Requested:</strong> {{services}}</p>
            <p style="margin: 5px 0;"><strong>Vehicle:</strong> {{vehicle_make}} {{vehicle_model}}</p>
            <p style="margin: 5px 0;"><strong>Estimated Duration:</strong> {{estimated_duration}}</p>
            <p style="margin: 5px 0;"><strong>Total Price:</strong> <span style="font-size: 24px; color: #28a745; font-weight: bold;">${{total}}</span></p>
          </div>

          <h3 style="color: #0B1C2D; margin: 20px 0 10px 0;">What's Included:</h3>
          <ul style="color: #333; line-height: 1.6;">
            <li>Professional mobile service at your location</li>
            <li>Premium detailing products and equipment</li>
            <li>Experienced and insured technicians</li>
            <li>Satisfaction guarantee</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{booking_link}}" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">Book Now</a>
            <a href="{{quote_link}}" style="background: #1DB7E8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Full Quote</a>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>Limited Time Offer:</strong><br>
            Book within 48 hours and receive 10% off your first service!</p>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Trusted Mobile Detailing | Elk River, MN</p>
            <p style="margin: 5px 0;">We look forward to serving you!</p>
          </div>
        </div>
      </div>
    `
  },

  // Payment Templates
  payment_successful: {
    subject: '✅ Payment Successful - Trusted Mobile Detailing',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Trusted Mobile Detailing</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Payment Successful</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #28a745; margin-bottom: 20px;">✅ Payment Received</h2>
          
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin: 0 0 15px 0; color: #155724;">Payment Details:</h3>
            <p style="margin: 5px 0;"><strong>Invoice Number:</strong> {{invoice_number}}</p>
            <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ${{amount}}</p>
            <p style="margin: 5px 0;"><strong>Payment Method:</strong> {{payment_method}}</p>
            <p style="margin: 5px 0;"><strong>Transaction ID:</strong> {{transaction_id}}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {{payment_date}}</p>
          </div>

          <p style="color: #333; line-height: 1.6;">Thank you for your payment! Your transaction has been processed successfully.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{invoice_link}}" style="background: #1DB7E8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Download Receipt</a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Trusted Mobile Detailing | Elk River, MN</p>
            <p style="margin: 5px 0;">We appreciate your business!</p>
          </div>
        </div>
      </div>
    `
  },

  payment_failed: {
    subject: '❌ Payment Failed - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Trusted Mobile Detailing</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Payment Failed</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #dc3545; margin-bottom: 20px;">❌ Payment Failed</h2>
          
          <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin: 0 0 15px 0; color: #721c24;">Payment Details:</h3>
            <p style="margin: 5px 0;"><strong>Invoice Number:</strong> {{invoice_number}}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${{amount}}</p>
            <p style="margin: 5px 0;"><strong>Attempt Date:</strong> {{payment_date}}</p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> {{failure_reason}}</p>
          </div>

          <p style="color: #333; line-height: 1.6;">We were unable to process your payment. Please check your payment information and try again.</p>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>What to do:</strong><br>
            1. Check your card details<br>
            2. Ensure sufficient funds<br>
            3. Try payment again<br>
            4. Contact us if issues persist</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{payment_link}}" style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">Try Again</a>
            <a href="{{contact_link}}" style="background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Contact Support</a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Trusted Mobile Detailing | Elk River, MN</p>
            <p style="margin: 5px 0;">We're here to help if you need assistance!</p>
          </div>
        </div>
      </div>
    `
  },

  // Invoice Templates
  invoice_sent: {
    subject: '📄 Invoice from Trusted Mobile Detailing',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #1DB7E8 0%, #0B1C2D 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Trusted Mobile Detailing</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Invoice</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #0B1C2D; margin-bottom: 20px;">📄 Invoice</h2>
          
          <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1DB7E8;">
            <h3 style="margin: 0 0 15px 0; color: #0B1C2D;">Invoice Details:</h3>
            <p style="margin: 5px 0;"><strong>Invoice Number:</strong> {{invoice_number}}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> {{due_date}}</p>
            <p style="margin: 5px 0;"><strong>Amount Due:</strong> ${{amount}}</p>
            <p style="margin: 5px 0;"><strong>Service Date:</strong> {{service_date}}</p>
          </div>

          <p style="color: #333; line-height: 1.6;">Please find your invoice attached. Payment is due by the date specified above.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{invoice_link}}" style="background: #1DB7E8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">View Invoice</a>
            <a href="{{payment_link}}" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Pay Now</a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Trusted Mobile Detailing | Elk River, MN</p>
            <p style="margin: 5px 0;">Thank you for your business!</p>
          </div>
        </div>
      </div>
    `
  },

  // Additional Templates
  welcome_email: {
    subject: '👋 Welcome to Trusted Mobile Detailing!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #1DB7E8 0%, #0B1C2D 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Trusted Mobile Detailing</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #0B1C2D; margin-bottom: 20px;">👋 Welcome to Trusted Mobile Detailing!</h2>
          
          <p style="color: #333; line-height: 1.6;">Thank you for creating an account with us! We're excited to provide you with professional mobile detailing services that come right to your location.</p>

          <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1DB7E8;">
            <h3 style="margin: 0 0 15px 0; color: #0B1C2D;">Your Account Benefits:</h3>
            <ul style="color: #333; line-height: 1.6;">
              <li>Book appointments online 24/7</li>
              <li>View your service history</li>
              <li>Manage your vehicles</li>
              <li>Track your bookings</li>
              <li>Receive exclusive offers</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{booking_link}}" style="background: #1DB7E8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">Book Your First Service</a>
            <a href="{{portal_link}}" style="background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Visit Your Portal</a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Trusted Mobile Detailing | Elk River, MN</p>
            <p style="margin: 5px 0;">We look forward to serving you!</p>
          </div>
        </div>
      </div>
    `
  },

  appointment_reminder: {
    subject: '⏰ Reminder: Your Mobile Detailing Appointment Tomorrow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Trusted Mobile Detailing</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Appointment Reminder</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #ff9800; margin-bottom: 20px;">⏰ Your Appointment is Tomorrow!</h2>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">Appointment Details:</h3>
            <p style="margin: 5px 0;"><strong>Booking Number:</strong> {{booking_number}}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {{preferred_date}}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> {{preferred_time}}</p>
            <p style="margin: 5px 0;"><strong>Service:</strong> {{service_name}}</p>
            <p style="margin: 5px 0;"><strong>Vehicle:</strong> {{vehicle_make}} {{vehicle_model}}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> {{service_location}}</p>
          </div>

          <h3 style="color: #0B1C2D; margin: 20px 0 10px 0;">Preparation Checklist:</h3>
          <ul style="color: #333; line-height: 1.6;">
            <li>✅ Ensure vehicle is accessible</li>
            <li>✅ Remove personal items from vehicle</li>
            <li>✅ Have payment method ready</li>
            <li>✅ Clear space around vehicle</li>
          </ul>

          <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <p style="margin: 0; color: #0c5460;"><strong>Need to reschedule?</strong><br>
            Call us as soon as possible: <strong>612-123-4567</strong></p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{booking_link}}" style="background: #1DB7E8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Appointment</a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Trusted Mobile Detailing | Elk River, MN</p>
            <p style="margin: 5px 0;">We can't wait to make your vehicle shine!</p>
          </div>
        </div>
      </div>
    `
  },

  review_request: {
    subject: '⭐ How Did We Do? Share Your Experience!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Trusted Mobile Detailing</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">How Did We Do?</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #ff9800; margin-bottom: 20px;">⭐ Share Your Experience!</h2>
          
          <p style="color: #333; line-height: 1.6;">We hope you loved your mobile detailing service! Your feedback helps us improve and helps other customers make informed decisions.</p>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">Recent Service:</h3>
            <p style="margin: 5px 0;"><strong>Service Date:</strong> {{preferred_date}}</p>
            <p style="margin: 5px 0;"><strong>Service:</strong> {{service_name}}</p>
            <p style="margin: 5px 0;"><strong>Vehicle:</strong> {{vehicle_make}} {{vehicle_model}}</p>
          </div>

          <h3 style="color: #0B1C2D; margin: 20px 0 10px 0;">Why Your Review Matters:</h3>
          <ul style="color: #333; line-height: 1.6;">
            <li>Helps other customers choose our services</li>
            <li>Allows us to improve our services</li>
            <li>Supports our small local business</li>
            <li>Builds trust in our community</li>
          </ul>

          <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;"><strong>Thank You for Choosing Us!</strong><br>
            We appreciate your business and look forward to serving you again.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{review_link}}" style="background: #ffc107; color: #212529; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">Leave a Review</a>
            <a href="{{booking_link}}" style="background: #1DB7E8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Service Details</a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Trusted Mobile Detailing | Elk River, MN</p>
            <p style="margin: 5px 0;">Your feedback helps us grow!</p>
          </div>
        </div>
      </div>
    `
  }
}
