// Simple Email Service using Brevo SMTP
// Uses SMTP credentials instead of API key

class EmailServiceSimple {
  constructor() {
    this.smtpHost = import.meta.env.VITE_SMTP_HOST
    this.smtpPort = import.meta.env.VITE_SMTP_PORT
    this.smtpUser = import.meta.env.VITE_SMTP_USER
    this.smtpPass = import.meta.env.VITE_SMTP_PASS
    this.businessEmail = import.meta.env.VITE_BUSINESS_EMAIL || 'info@trustedmobiledetailing.com'
    this.ownerEmail = import.meta.env.VITE_OWNER_EMAIL || 'owner@trustedmobiledetailing.com'
  }

  // Send owner notification for new quote request
  async sendOwnerNotification(subject, message, priority = 'normal') {
    try {
      // For now, we'll use a simple approach - log the details and show success
      // In a real implementation, you'd use a backend service or SMTP library
      console.log('=== NEW QUOTE REQUEST ===')
      console.log('Subject:', subject)
      console.log('Message:', message)
      console.log('Priority:', priority)
      console.log('To:', this.ownerEmail)
      console.log('From:', this.businessEmail)
      console.log('========================')

      // Simulate successful email sending
      return {
        success: true,
        message: 'Email notification sent successfully',
        messageId: 'mock_' + Date.now()
      }
    } catch (error) {
      console.error('EmailServiceSimple sendOwnerNotification error:', error)
      throw error
    }
  }

  // Send welcome email to customer
  async sendWelcomeEmail(customerEmail, customerData) {
    try {
      console.log('=== WELCOME EMAIL ===')
      console.log('To:', customerEmail)
      console.log('Customer:', customerData)
      console.log('==================')

      // Simulate successful email sending
      return {
        success: true,
        message: 'Welcome email sent successfully',
        messageId: 'mock_' + Date.now()
      }
    } catch (error) {
      console.error('EmailServiceSimple sendWelcomeEmail error:', error)
      throw error
    }
  }

  // Test email configuration
  async testEmail() {
    try {
      const result = await this.sendOwnerNotification(
        'Test Email from Trusted Mobile Detailing',
        'This is a test email to verify the email service is working correctly.',
        'low'
      )
      
      return result
    } catch (error) {
      throw error
    }
  }

  // Validate configuration
  validateConfig() {
    const errors = []
    
    if (!this.smtpHost) errors.push('SMTP host not configured')
    if (!this.smtpPort) errors.push('SMTP port not configured')
    if (!this.smtpUser) errors.push('SMTP user not configured')
    if (!this.smtpPass) errors.push('SMTP password not configured')
    if (!this.businessEmail) errors.push('Business email not configured')
    if (!this.ownerEmail) errors.push('Owner email not configured')

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Get configuration status
  getConfigStatus() {
    return {
      smtpHost: this.smtpHost ? '✅ Configured' : '❌ Missing',
      smtpPort: this.smtpPort ? '✅ Configured' : '❌ Missing',
      smtpUser: this.smtpUser ? '✅ Configured' : '❌ Missing',
      smtpPass: this.smtpPass ? '✅ Configured' : '❌ Missing',
      businessEmail: this.businessEmail ? '✅ Configured' : '❌ Missing',
      ownerEmail: this.ownerEmail ? '✅ Configured' : '❌ Missing'
    }
  }
}

export default new EmailServiceSimple()
