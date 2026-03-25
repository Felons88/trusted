import { supabase } from '../lib/supabase'
import { emailTemplates } from './emailTemplates'
import toast from 'react-hot-toast'

class EmailTriggerService {
  constructor() {
    this.triggers = {
      // Booking status triggers
      'booking:status:confirmed': this.handleBookingConfirmed.bind(this),
      'booking:status:canceled': this.handleBookingCanceled.bind(this),
      'booking:status:completed': this.handleBookingCompleted.bind(this),
      'booking:status:pending': this.handleBookingPendingReminder.bind(this),
      'booking:created': this.handleBookingCreated.bind(this),
      
      // Quote request triggers
      'quote:status:pending': this.handleQuoteReceived.bind(this),
      'quote:status:quoted': this.handleQuoteReady.bind(this),
      'quote:created': this.handleQuoteCreated.bind(this),
      
      // Payment triggers
      'payment:status:succeeded': this.handlePaymentSuccessful.bind(this),
      'payment:status:failed': this.handlePaymentFailed.bind(this),
      'payment:created': this.handlePaymentCreated.bind(this),
      
      // Invoice triggers
      'invoice:status:sent': this.handleInvoiceSent.bind(this),
      'invoice:status:paid': this.handleInvoicePaid.bind(this),
      'invoice:status:overdue': this.handleInvoiceOverdue.bind(this),
      'invoice:created': this.handleInvoiceCreated.bind(this),
      
      // Additional triggers
      'user:registered': this.handleWelcomeEmail.bind(this),
      'booking:reminder': this.handleAppointmentReminder.bind(this),
      'booking:review_request': this.handleReviewRequest.bind(this)
    }
  }

  // Replace template variables with actual data
  replaceTemplateVariables(template, data) {
    let html = template.html
    let subject = template.subject

    // Replace all {{variable}} placeholders
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      html = html.replace(regex, data[key] || '')
      subject = subject.replace(regex, data[key] || '')
    })

    return { subject, html }
  }

  // Send email using existing Supabase email edge function
  async sendEmail(templateKey, recipientEmail, data, attachments = []) {
    let emailLogId = null
    
    try {
      // Create email log entry
      const template = emailTemplates[templateKey]
      if (!template) {
        throw new Error(`Template ${templateKey} not found`)
      }

      const { subject, html } = this.replaceTemplateVariables(template, data)
      
      // Log the email attempt
      const { data: logData, error: logError } = await supabase
        .from('email_history')
        .insert([{
          template_key: templateKey,
          template_name: template.subject,
          recipient_email: recipientEmail,
          recipient_name: data.client_name || data.name || 'Valued Customer',
          subject: subject,
          status: 'pending',
          client_id: data.client_id || null,
          booking_id: data.booking_id || null,
          quote_request_id: data.quote_request_id || null,
          invoice_id: data.invoice_id || null,
          payment_attempt_id: data.payment_attempt_id || null,
          html_content: html,
          text_content: html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
          attachments: attachments || [],
          metadata: {
            template_data: data,
            sent_via: 'emailTriggerService'
          },
          created_by: data.created_by || null
        }])
        .select('id')
        .single()

      if (logError) {
        console.error('Failed to create email log:', logError)
      } else {
        emailLogId = logData.id
      }

      // Use the existing email-service edge function
      const { error } = await supabase.functions.invoke('email-service', {
        body: {
          to: recipientEmail,
          subject: subject,
          html: html,
          attachments: attachments
        }
      })

      if (error) {
        // Update log with failure
        if (emailLogId) {
          await supabase
            .from('email_history')
            .update({
              status: 'failed',
              error_message: error.message,
              sent_at: new Date().toISOString()
            })
            .eq('id', emailLogId)
        }
        throw error
      }

      // Update log with success
      if (emailLogId) {
        await supabase
          .from('email_history')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', emailLogId)
      }

      console.log(`Email sent: ${templateKey} to ${recipientEmail}`)
      return { success: true, emailLogId }
    } catch (error) {
      console.error(`Failed to send email ${templateKey}:`, error)
      
      // Update log with failure if we have an ID
      if (emailLogId) {
        await supabase
          .from('email_history')
          .update({
            status: 'failed',
            error_message: error.message,
            sent_at: new Date().toISOString()
          })
          .eq('id', emailLogId)
      }
      
      return { success: false, error: error.message }
    }
  }

  // Trigger email based on event
  async triggerEmail(eventType, data) {
    try {
      const trigger = this.triggers[eventType]
      if (!trigger) {
        console.log(`No email trigger found for: ${eventType}`)
        return { success: true, message: 'No trigger needed' }
      }

      const result = await trigger(data)
      return result
    } catch (error) {
      console.error(`Email trigger failed for ${eventType}:`, error)
      return { success: false, error: error.message }
    }
  }

  // Booking Status Handlers
  async handleBookingConfirmed(data) {
    const { booking, client } = data
    
    const templateData = {
      booking_number: booking.booking_number,
      preferred_date: new Date(booking.preferred_date).toLocaleDateString(),
      preferred_time: booking.preferred_time || 'TBD',
      service_name: booking.services?.name || 'Mobile Detailing Service',
      vehicle_make: booking.vehicles?.make || 'N/A',
      vehicle_model: booking.vehicles?.model || 'N/A',
      vehicle_year: booking.vehicles?.year || 'N/A',
      service_location: booking.service_location || 'Your location',
      total: booking.total || '0.00',
      booking_link: `${window.location.origin}/client-portal/bookings/${booking.id}`,
      client_name: client?.full_name || 'Valued Customer',
      // Add IDs for logging - use client.id (from clients table)
      client_id: client?.id,
      booking_id: booking.id
    }

    return await this.sendEmail(
      'booking_confirmed',
      client?.email,
      templateData
    )
  }

  async handleBookingCanceled(data) {
    const { booking, client } = data
    
    const templateData = {
      booking_number: booking.booking_number,
      preferred_date: new Date(booking.preferred_date).toLocaleDateString(),
      preferred_time: booking.preferred_time || 'TBD',
      service_name: booking.services?.name || 'Mobile Detailing Service',
      vehicle_make: booking.vehicles?.make || 'N/A',
      vehicle_model: booking.vehicles?.model || 'N/A',
      quote_link: `${window.location.origin}/quote`,
      client_name: client?.full_name || 'Valued Customer'
    }

    return await this.sendEmail(
      'booking_canceled',
      client?.email,
      templateData
    )
  }

  async handleBookingCompleted(data) {
    const { booking, client } = data
    
    const templateData = {
      booking_number: booking.booking_number,
      preferred_date: new Date(booking.preferred_date).toLocaleDateString(),
      service_name: booking.services?.name || 'Mobile Detailing Service',
      vehicle_make: booking.vehicles?.make || 'N/A',
      vehicle_model: booking.vehicles?.model || 'N/A',
      total: booking.total || '0.00',
      booking_link: `${window.location.origin}/client-portal/bookings/${booking.id}`,
      review_link: `${window.location.origin}/reviews`,
      client_name: client?.full_name || 'Valued Customer',
      // Add IDs for logging
      client_id: client?.id,
      booking_id: booking.id
    }

    // Send completion email
    const completionResult = await this.sendEmail(
      'booking_completed',
      client?.email,
      templateData
    )

    // Schedule review request email for 24 hours later
    if (completionResult.success) {
      setTimeout(async () => {
        await this.triggerEmail('booking:review_request', data)
      }, 24 * 60 * 60 * 1000) // 24 hours
    }

    return completionResult
  }

  async handleBookingPendingReminder(data) {
    const { booking, client } = data
    
    const templateData = {
      booking_number: booking.booking_number,
      preferred_date: new Date(booking.preferred_date).toLocaleDateString(),
      preferred_time: booking.preferred_time || 'TBD',
      service_name: booking.services?.name || 'Mobile Detailing Service',
      vehicle_make: booking.vehicles?.make || 'N/A',
      vehicle_model: booking.vehicles?.model || 'N/A',
      total: booking.total || '0.00',
      booking_link: `${window.location.origin}/client-portal/bookings/${booking.id}`,
      contact_link: `${window.location.origin}/contact`,
      client_name: client?.full_name || 'Valued Customer'
    }

    return await this.sendEmail(
      'booking_pending_reminder',
      client?.email,
      templateData
    )
  }

  async handleBookingCreated(data) {
    const { booking, client } = data
    
    // Send confirmation email immediately if it's not pending
    if (booking.status === 'confirmed') {
      return await this.handleBookingConfirmed(data)
    }
    
    // Otherwise send pending reminder
    return await this.handleBookingPendingReminder(data)
  }

  // Quote Request Handlers
  async handleQuoteReceived(data) {
    const { quoteRequest } = data
    
    const templateData = {
      quote_number: quoteRequest.id.substring(0, 8).toUpperCase(),
      services: quoteRequest.services_requested || 'Mobile Detailing',
      vehicle_make: quoteRequest.vehicle_make || 'N/A',
      vehicle_model: quoteRequest.vehicle_model || 'N/A',
      client_name: quoteRequest.name || 'Valued Customer'
    }

    return await this.sendEmail(
      'quote_received',
      quoteRequest.email,
      templateData
    )
  }

  async handleQuoteReady(data) {
    const { quoteRequest, quote } = data
    
    const templateData = {
      quote_number: quoteRequest.id.substring(0, 8).toUpperCase(),
      services: quote.services || 'Mobile Detailing',
      vehicle_make: quoteRequest.vehicle_make || 'N/A',
      vehicle_model: quoteRequest.vehicle_model || 'N/A',
      estimated_duration: quote.estimated_duration || '2-3 hours',
      total: quote.total || '0.00',
      booking_link: `${window.location.origin}/book-now?quote=${quote.id}`,
      quote_link: `${window.location.origin}/quote/${quote.id}`,
      client_name: quoteRequest.name || 'Valued Customer'
    }

    return await this.sendEmail(
      'quote_ready',
      quoteRequest.email,
      templateData
    )
  }

  async handleQuoteCreated(data) {
    const { quoteRequest } = data
    return await this.handleQuoteReceived(data)
  }

  // Payment Handlers
  async handlePaymentSuccessful(data) {
    const { paymentAttempt, invoice, client } = data
    
    const templateData = {
      invoice_number: invoice.invoice_number,
      amount: invoice.total || '0.00',
      payment_method: paymentAttempt.payment_method || 'Card',
      transaction_id: paymentAttempt.stripe_payment_intent_id || 'N/A',
      payment_date: new Date().toLocaleDateString(),
      invoice_link: `${window.location.origin}/receipt/${invoice.id}`,
      client_name: client?.full_name || 'Valued Customer'
    }

    return await this.sendEmail(
      'payment_successful',
      client?.email,
      templateData
    )
  }

  async handlePaymentFailed(data) {
    const { paymentAttempt, invoice, client } = data
    
    const templateData = {
      invoice_number: invoice.invoice_number,
      amount: invoice.total || '0.00',
      payment_date: new Date().toLocaleDateString(),
      failure_reason: paymentAttempt.failure_reason || 'Payment could not be processed',
      payment_link: `${window.location.origin}/payment/${invoice.id}`,
      contact_link: `${window.location.origin}/contact`,
      client_name: client?.full_name || 'Valued Customer'
    }

    return await this.sendEmail(
      'payment_failed',
      client?.email,
      templateData
    )
  }

  async handlePaymentCreated(data) {
    // Usually no email needed for payment creation
    return { success: true, message: 'No email needed for payment creation' }
  }

  // Invoice Handlers
  async handleInvoiceSent(data) {
    const { invoice, client } = data
    
    const templateData = {
      invoice_number: invoice.invoice_number,
      due_date: new Date(invoice.due_date).toLocaleDateString(),
      amount: invoice.total || '0.00',
      service_date: invoice.service_date ? new Date(invoice.service_date).toLocaleDateString() : 'N/A',
      invoice_link: `${window.location.origin}/invoices/${invoice.id}`,
      payment_link: `${window.location.origin}/payment/${invoice.id}`,
      client_name: client?.full_name || 'Valued Customer'
    }

    return await this.sendEmail(
      'invoice_sent',
      client?.email,
      templateData
    )
  }

  async handleInvoicePaid(data) {
    const { invoice, client } = data
    // Payment successful email already handles this
    return { success: true, message: 'Payment email already sent' }
  }

  async handleInvoiceOverdue(data) {
    const { invoice, client } = data
    
    const templateData = {
      invoice_number: invoice.invoice_number,
      due_date: new Date(invoice.due_date).toLocaleDateString(),
      amount: invoice.total || '0.00',
      invoice_link: `${window.location.origin}/invoices/${invoice.id}`,
      payment_link: `${window.location.origin}/payment/${invoice.id}`,
      client_name: client?.full_name || 'Valued Customer'
    }

    // For now, reuse invoice_sent template
    return await this.sendEmail(
      'invoice_sent',
      client?.email,
      templateData
    )
  }

  async handleInvoiceCreated(data) {
    const { invoice, client } = data
    return await this.handleInvoiceSent(data)
  }

  // Additional Handlers
  async handleWelcomeEmail(data) {
    const { user } = data
    
    const templateData = {
      client_name: user?.full_name || 'Valued Customer',
      booking_link: `${window.location.origin}/book-now`,
      portal_link: `${window.location.origin}/client-portal`
    }

    return await this.sendEmail(
      'welcome_email',
      user?.email,
      templateData
    )
  }

  async handleAppointmentReminder(data) {
    const { booking, client } = data
    
    const templateData = {
      booking_number: booking.booking_number,
      preferred_date: new Date(booking.preferred_date).toLocaleDateString(),
      preferred_time: booking.preferred_time || 'TBD',
      service_name: booking.services?.name || 'Mobile Detailing Service',
      vehicle_make: booking.vehicles?.make || 'N/A',
      vehicle_model: booking.vehicles?.model || 'N/A',
      service_location: booking.service_location || 'Your location',
      booking_link: `${window.location.origin}/client-portal/bookings/${booking.id}`,
      client_name: client?.full_name || 'Valued Customer'
    }

    return await this.sendEmail(
      'appointment_reminder',
      client?.email,
      templateData
    )
  }

  async handleReviewRequest(data) {
    const { booking, client } = data
    
    const templateData = {
      preferred_date: new Date(booking.preferred_date).toLocaleDateString(),
      service_name: booking.services?.name || 'Mobile Detailing Service',
      vehicle_make: booking.vehicles?.make || 'N/A',
      vehicle_model: booking.vehicles?.model || 'N/A',
      review_link: `${window.location.origin}/reviews`,
      booking_link: `${window.location.origin}/client-portal/bookings/${booking.id}`,
      client_name: client?.full_name || 'Valued Customer'
    }

    return await this.sendEmail(
      'review_request',
      client?.email,
      templateData
    )
  }

  // Helper method to get client email from booking
  async getClientEmail(bookingId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          client_id,
          clients (
            email,
            full_name
          )
        `)
        .eq('id', bookingId)
        .single()

      if (error) throw error
      return data.clients
    } catch (error) {
      console.error('Error getting client email:', error)
      return null
    }
  }

  // Get full booking data with relations
  async getFullBookingData(bookingId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients (
            email,
            full_name,
            phone
          ),
          vehicles (
            make,
            model,
            year
          ),
          services (
            name,
            description
          )
        `)
        .eq('id', bookingId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting full booking data:', error)
      return null
    }
  }

  // Get full quote request data
  async getFullQuoteData(quoteRequestId) {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', quoteRequestId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting quote data:', error)
      return null
    }
  }

  // Schedule automated reminders
  scheduleAppointmentReminders(booking) {
    // Schedule reminder 24 hours before appointment
    const appointmentTime = new Date(`${booking.preferred_date} ${booking.preferred_time || '09:00'}`)
    const reminderTime = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000)
    
    if (reminderTime > new Date()) {
      setTimeout(async () => {
        const fullBookingData = await this.getFullBookingData(booking.id)
        if (fullBookingData) {
          await this.triggerEmail('booking:reminder', {
            booking: fullBookingData,
            client: fullBookingData.clients
          })
        }
      }, reminderTime.getTime() - Date.now())
    }
  }

  // Get available templates
  getAvailableTemplates() {
    return Object.keys(emailTemplates)
  }

  // Add custom template
  addTemplate(key, template) {
    emailTemplates[key] = template
  }
}

export const emailTriggerService = new EmailTriggerService()
