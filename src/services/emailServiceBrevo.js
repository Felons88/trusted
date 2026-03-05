// Email Service using Brevo SMTP
// Handles all email communications for the mobile detailing business

class EmailService {
  constructor() {
    this.smtpHost = import.meta.env.SMTP_HOST
    this.smtpPort = import.meta.env.SMTP_PORT
    this.smtpUser = import.meta.env.SMTP_USER
    this.smtpPass = import.meta.env.SMTP_PASS
    this.brevoApiKey = import.meta.env.BREVO_API_KEY
    this.businessEmail = import.meta.env.BUSINESS_EMAIL || 'info@trustedmobiledetailing.com'
    this.ownerEmail = import.meta.env.OWNER_EMAIL || 'owner@trustedmobiledetailing.com'
    this.baseUrl = 'https://api.brevo.com/v3'
  }

  // Send booking confirmation email
  async sendBookingConfirmation(customerEmail, bookingDetails) {
    try {
      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': this.brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'Trusted Mobile Detailing',
            email: this.businessEmail
          },
          to: [{ email: customerEmail }],
          subject: `Booking Confirmation - ${bookingDetails.serviceType}`,
          htmlContent: this.generateBookingConfirmationTemplate(bookingDetails)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send booking confirmation')
      }

      return await response.json()
    } catch (error) {
      console.error('EmailService sendBookingConfirmation error:', error)
      throw error
    }
  }

  // Send appointment reminder email
  async sendAppointmentReminder(customerEmail, bookingDetails) {
    try {
      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': this.brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'Trusted Mobile Detailing',
            email: this.businessEmail
          },
          to: [{ email: customerEmail }],
          subject: `Appointment Reminder - ${bookingDetails.date} at ${bookingDetails.time}`,
          htmlContent: this.generateReminderTemplate(bookingDetails)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send appointment reminder')
      }

      return await response.json()
    } catch (error) {
      console.error('EmailService sendAppointmentReminder error:', error)
      throw error
    }
  }

  // Send welcome email to new customers
  async sendWelcomeEmail(customerEmail, customerDetails) {
    try {
      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': this.brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'Trusted Mobile Detailing',
            email: this.businessEmail
          },
          to: [{ email: customerEmail }],
          subject: 'Welcome to Trusted Mobile Detailing!',
          htmlContent: this.generateWelcomeTemplate(customerDetails)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send welcome email')
      }

      return await response.json()
    } catch (error) {
      console.error('EmailService sendWelcomeEmail error:', error)
      throw error
    }
  }

  // Send notification to business owner
  async sendOwnerNotification(subject, message, priority = 'normal') {
    try {
      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': this.brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'Trusted Mobile Detailing System',
            email: this.businessEmail
          },
          to: [{ email: this.ownerEmail }],
          subject: `[${priority.toUpperCase()}] ${subject}`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${subject}</h2>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
                <p>${message}</p>
                <p><small>Sent at: ${new Date().toLocaleString()}</small></p>
              </div>
            </div>
          `
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send owner notification')
      }

      return await response.json()
    } catch (error) {
      console.error('EmailService sendOwnerNotification error:', error)
      throw error
    }
  }

  // Test email configuration
  async testEmail() {
    try {
      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': this.brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'Trusted Mobile Detailing',
            email: this.businessEmail
          },
          to: [{ email: this.ownerEmail }],
          subject: 'Email Service Test',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af;">Email Service Test Successful!</h2>
              <p>Your Brevo SMTP configuration is working correctly.</p>
              <p>Time: ${new Date().toLocaleString()}</p>
            </div>
          `
        })
      })

      if (!response.ok) {
        throw new Error('Email test failed')
      }

      return await response.json()
    } catch (error) {
      console.error('EmailService testEmail error:', error)
      throw error
    }
  }

  // Email Templates
  generateBookingConfirmationTemplate(booking) {
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

  generateReminderTemplate(booking) {
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

  generateWelcomeTemplate(customer) {
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

  // Validate email configuration
  validateConfig() {
    const errors = []

    if (!this.brevoApiKey || this.brevoApiKey === 'your_brevo_api_key') {
      errors.push('Brevo API key is required')
    }

    if (!this.businessEmail) {
      errors.push('Business email is required')
    }

    if (!this.smtpHost || !this.smtpPort || !this.smtpUser || !this.smtpPass) {
      errors.push('SMTP configuration is incomplete')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Validate email address format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

export default new EmailService()
