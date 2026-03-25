// Stripe Payment Service
// Handles payment processing, refunds, and webhooks

import { supabase } from '../lib/supabase'

class StripeService {
  constructor() {
    this.publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    this.baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173'
  }

  // Initialize Stripe
  init() {
    if (!this.publishableKey || this.publishableKey === 'your_stripe_publishable_key') {
      throw new Error('Stripe publishable key not configured')
    }
    
    // Load Stripe script dynamically
    return new Promise((resolve, reject) => {
      if (window.Stripe) {
        resolve(window.Stripe(this.publishableKey))
        return
      }

      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/'
      script.onload = () => resolve(window.Stripe(this.publishableKey))
      script.onerror = () => reject(new Error('Failed to load Stripe'))
      document.head.appendChild(script)
    })
  }

  // Create payment intent for booking
  async createPaymentIntent(amount, bookingId, customerEmail) {
    try {
      // Use Supabase function instead of API endpoint
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            bookingId,
            customerEmail
          }
        }
      })

      if (error) {
        console.error('Supabase function error:', error)
        throw new Error(error.message || 'Failed to create payment intent')
      }

      return data
    } catch (error) {
      console.error('Stripe createPaymentIntent error:', error)
      throw error
    }
  }

  // Confirm payment with Stripe
  async confirmPayment(stripe, elements, clientSecret) {
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${this.baseUrl}/booking-confirmation`,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return paymentIntent
    } catch (error) {
      console.error('Stripe confirmPayment error:', error)
      throw error
    }
  }

  // Create payment elements
  createPaymentElements(stripe, clientSecret) {
    const elements = stripe.elements({ clientSecret })
    
    const paymentElement = elements.create('payment-element', {
      layout: 'tabs',
      defaultValues: {
        billingDetails: {
          address: {
            country: 'US'
          }
        }
      }
    })

    return { elements, paymentElement }
  }

  // Process refund
  async processRefund(paymentIntentId, amount, reason) {
    try {
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined,
          reason: reason || 'requested_by_customer'
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to process refund')
      }

      return data
    } catch (error) {
      console.error('Stripe refund error:', error)
      throw error
    }
  }

  // Get payment status
  async getPaymentStatus(paymentIntentId) {
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-status', {
        body: {
          paymentIntentId
        }
      })
      
      if (error) {
        throw new Error(error.message || 'Failed to get payment status')
      }

      return data
    } catch (error) {
      console.error('Stripe getPaymentStatus error:', error)
      throw error
    }
  }

  // Create customer
  async createCustomer(email, name, phone) {
    try {
      const { data, error } = await supabase.functions.invoke('create-customer', {
        body: {
          email,
          name,
          phone
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to create customer')
      }

      return data
    } catch (error) {
      console.error('Stripe createCustomer error:', error)
      throw error
    }
  }

  // Setup recurring payment for subscription plans
  async setupSubscription(customerId, priceId, paymentMethodId) {
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          customerId,
          priceId,
          paymentMethodId
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to create subscription')
      }

      return data
    } catch (error) {
      console.error('Stripe setupSubscription error:', error)
      throw error
    }
  }

  // Format currency for display
  formatAmount(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100)
  }

  // Validate payment method
  validatePaymentMethod(paymentMethod) {
    const errors = []

    if (!paymentMethod.card) {
      errors.push('Card information is required')
    }

    if (!paymentMethod.billing_details?.email) {
      errors.push('Email is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export default new StripeService()
