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
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.businessEmail,
          to: [customerEmail],
          subject: `Appointment Reminder - ${bookingDetails.date} at ${bookingDetails.time}`,
          html: this.generateReminderTemplate(bookingDetails)
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

  // Send payment receipt
  async sendPaymentReceipt(customerEmail, paymentDetails, bookingDetails) {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.businessEmail,
          to: [customerEmail],
          subject: `Payment Receipt - Order #${paymentDetails.orderId}`,
          html: this.generateReceiptTemplate(paymentDetails, bookingDetails)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send payment receipt')
      }

      return await response.json()
    } catch (error) {
      console.error('EmailService sendPaymentReceipt error:', error)
      throw error
    }
  }

  // Send welcome email to new customers
  async sendWelcomeEmail(customerEmail, customerDetails) {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.businessEmail,
          to: [customerEmail],
          subject: 'Welcome to Trusted Mobile Detailing!',
          html: this.generateWelcomeTemplate(customerDetails)
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

  // Send service completion email
  async sendServiceCompletionEmail(customerEmail, bookingDetails, beforeAfterPhotos = []) {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.businessEmail,
          to: [customerEmail],
          subject: `Service Completed - ${bookingDetails.serviceType}`,
          html: this.generateServiceCompletionTemplate(bookingDetails, beforeAfterPhotos)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send service completion email')
      }

      return await response.json()
    } catch (error) {
      console.error('EmailService sendServiceCompletionEmail error:', error)
      throw error
    }
  }

  // Send follow-up review request
  async sendReviewRequest(customerEmail, bookingDetails) {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.businessEmail,
          to: [customerEmail],
          subject: 'How was your detailing service?',
          html: this.generateReviewRequestTemplate(bookingDetails)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send review request')
      }

      return await response.json()
    } catch (error) {
      console.error('EmailService sendReviewRequest error:', error)
      throw error
    }
  }

  // Send promotional email
  async sendPromotionalEmail(customerEmail, promotionDetails) {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.businessEmail,
          to: [customerEmail],
          subject: promotionDetails.subject,
          html: this.generatePromotionalTemplate(promotionDetails)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send promotional email')
      }

      return await response.json()
    } catch (error) {
      console.error('EmailService sendPromotionalEmail error:', error)
      throw error
    }
  }

  // Send notification to business owner
  async sendOwnerNotification(subject, message, priority = 'normal') {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.businessEmail,
          to: [this.ownerEmail],
          subject: `[${priority.toUpperCase()}] ${subject}`,
          html: `
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

  generateReceiptTemplate(payment, booking) {
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

  generateServiceCompletionTemplate(booking, photos) {
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

  generateReviewRequestTemplate(booking) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1>How Did We Do?</h1>
          <p>Trusted Mobile Detailing</p>
        </div>
        <div style="padding: 20px;">
          <h2>Share Your Experience</h2>
          <p>Hi there!</p>
          <p>We recently completed your ${booking.serviceType} service and would love to hear your feedback.</p>
          
          <h3>Why Your Review Matters</h3>
          <ul>
            <li>Helps us improve our services</li>
            <li>Assists other customers in making decisions</li>
            <li>Supports our small business</li>
          </ul>
          
          <p><a href="#" style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Leave a Review</a></p>
          
          <p>Thank you for your business!</p>
        </div>
      </div>
    `
  }

  generatePromotionalTemplate(promotion) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1>Special Offer!</h1>
          <p>Trusted Mobile Detailing</p>
        </div>
        <div style="padding: 20px;">
          <h2>${promotion.title}</h2>
          <p>${promotion.description}</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center;">
            <h3>${promotion.discount}</h3>
            <p>Valid until ${promotion.expiryDate}</p>
            <p><a href="#" style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Book Now</a></p>
          </div>
          
          <p>Terms and conditions apply. Limited time offer.</p>
        </div>
      </div>
    `
  }

  // Validate email configuration
  validateConfig() {
    const errors = []

    if (!this.apiKey || this.apiKey === 'your_resend_api_key') {
      errors.push('Resend API key is required')
    }

    if (!this.businessEmail) {
      errors.push('Business email is required')
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

  // Send bulk emails (for promotions)
  async sendBulkEmails(emailList, templateData) {
    const results = []
    
    for (const email of emailList) {
      try {
        const result = await this.sendPromotionalEmail(email, templateData)
        results.push({ email, success: true, result })
      } catch (error) {
        results.push({ email, success: false, error: error.message })
      }
    }
    
    return results
  }
}

export default new EmailService()
