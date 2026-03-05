import { supabase } from '../lib/supabase'

export const sendQuoteRequestEmail = async (quoteData) => {
  try {
    const response = await fetch('/api/send-quote-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quoteData),
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    await supabase.from('email_logs').insert({
      to_email: quoteData.email,
      subject: 'Quote Request Received - Trusted Mobile Detailing',
      template: 'quote_request',
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return await response.json()
  } catch (error) {
    console.error('Email send error:', error)
    
    await supabase.from('email_logs').insert({
      to_email: quoteData.email,
      subject: 'Quote Request Received - Trusted Mobile Detailing',
      template: 'quote_request',
      status: 'failed',
      error_message: error.message,
    })
    
    throw error
  }
}

export const sendServiceCompletionEmail = async (bookingData, clientEmail) => {
  try {
    const response = await fetch('/api/send-completion-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingData, clientEmail }),
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    await supabase.from('email_logs').insert({
      to_email: clientEmail,
      subject: 'Service Completed - Trusted Mobile Detailing',
      template: 'service_completion',
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return await response.json()
  } catch (error) {
    console.error('Email send error:', error)
    
    await supabase.from('email_logs').insert({
      to_email: clientEmail,
      subject: 'Service Completed - Trusted Mobile Detailing',
      template: 'service_completion',
      status: 'failed',
      error_message: error.message,
    })
    
    throw error
  }
}

export const sendContactFormEmail = async (contactData) => {
  try {
    const response = await fetch('/api/send-contact-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    return await response.json()
  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
}

export const sendBookingConfirmationEmail = async (bookingData, clientEmail) => {
  try {
    const response = await fetch('/api/send-booking-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingData, clientEmail }),
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    await supabase.from('email_logs').insert({
      to_email: clientEmail,
      subject: 'Booking Confirmation - Trusted Mobile Detailing',
      template: 'booking_confirmation',
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return await response.json()
  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
}
