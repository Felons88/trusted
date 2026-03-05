// Stripe Payment Service
// Handles payment processing, refunds, and webhooks

class StripeService {
  constructor() {
    this.publishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY
    this.baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173'
  }

  // Initialize Stripe
  init() {
    if (!this.publishableKey || this.publishableKey === 'your_stripe_public_key') {
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
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            bookingId,
            customerEmail
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      return await response.json()
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
      const response = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined,
          reason: reason || 'requested_by_customer'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process refund')
      }

      return await response.json()
    } catch (error) {
      console.error('Stripe refund error:', error)
      throw error
    }
  }

  // Get payment status
  async getPaymentStatus(paymentIntentId) {
    try {
      const response = await fetch(`/api/stripe/payment-status/${paymentIntentId}`)
      
      if (!response.ok) {
        throw new Error('Failed to get payment status')
      }

      return await response.json()
    } catch (error) {
      console.error('Stripe getPaymentStatus error:', error)
      throw error
    }
  }

  // Create customer
  async createCustomer(email, name, phone) {
    try {
      const response = await fetch('/api/stripe/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          phone
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create customer')
      }

      return await response.json()
    } catch (error) {
      console.error('Stripe createCustomer error:', error)
      throw error
    }
  }

  // Setup recurring payment for subscription plans
  async setupSubscription(customerId, priceId, paymentMethodId) {
    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          priceId,
          paymentMethodId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create subscription')
      }

      return await response.json()
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
