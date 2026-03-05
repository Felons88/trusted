// PayPal Payment Service
// Handles PayPal payments, subscriptions, and order management

class PayPalService {
  constructor() {
    this.clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID
    this.mode = import.meta.env.PAYPAL_MODE || 'sandbox'
    this.baseUrl = this.mode === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com'
  }

  // Initialize PayPal SDK
  async init() {
    if (!this.clientId || this.clientId === 'your_paypal_client_id') {
      throw new Error('PayPal client ID not configured')
    }

    return new Promise((resolve, reject) => {
      if (window.paypal) {
        resolve(window.paypal)
        return
      }

      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${this.clientId}&currency=USD&intent=capture`
      script.onload = () => resolve(window.paypal)
      script.onerror = () => reject(new Error('Failed to load PayPal SDK'))
      document.head.appendChild(script)
    })
  }

  // Get access token for API calls
  async getAccessToken() {
    try {
      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.clientId}:${import.meta.env.PAYPAL_CLIENT_SECRET}`)}`
        },
        body: 'grant_type=client_credentials'
      })

      if (!response.ok) {
        throw new Error('Failed to get PayPal access token')
      }

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('PayPal getAccessToken error:', error)
      throw error
    }
  }

  // Create order for payment
  async createOrder(amount, bookingId, description) {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: bookingId,
            description: description || 'Mobile Detailing Service',
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2)
            },
            custom_id: bookingId
          }]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create PayPal order')
      }

      return await response.json()
    } catch (error) {
      console.error('PayPal createOrder error:', error)
      throw error
    }
  }

  // Capture payment for approved order
  async capturePayment(orderId) {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to capture PayPal payment')
      }

      return await response.json()
    } catch (error) {
      console.error('PayPal capturePayment error:', error)
      throw error
    }
  }

  // Render PayPal buttons
  renderPayPalButton(container, amount, bookingId, onSuccess, onError) {
    return window.paypal.Buttons({
      createOrder: async (data, actions) => {
        try {
          const order = await this.createOrder(amount, bookingId, 'Mobile Detailing Service')
          return order.id
        } catch (error) {
          onError(error)
          throw error
        }
      },
      onApprove: async (data, actions) => {
        try {
          const capture = await this.capturePayment(data.orderID)
          onSuccess(capture)
        } catch (error) {
          onError(error)
        }
      },
      onError: (err) => {
        onError(err)
      },
      onCancel: () => {
        console.log('PayPal payment cancelled')
      },
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'pay'
      }
    }).render(container)
  }

  // Create subscription
  async createSubscription(planId, customerId) {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          plan_id: planId,
          customer: customerId,
          application_context: {
            brand_name: 'Trusted Mobile Detailing',
            locale: 'en-US',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            payment_method: {
              payer_selected: 'PAYPAL',
              payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
            },
            return_url: `${import.meta.env.VITE_APP_URL}/subscription-success`,
            cancel_url: `${import.meta.env.VITE_APP_URL}/subscription-cancelled`
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create PayPal subscription')
      }

      return await response.json()
    } catch (error) {
      console.error('PayPal createSubscription error:', error)
      throw error
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId, reason = 'Customer requested') {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          reason
        })
      })

      if (!response.ok) {
        throw new Error('Failed to cancel PayPal subscription')
      }

      return await response.json()
    } catch (error) {
      console.error('PayPal cancelSubscription error:', error)
      throw error
    }
  }

  // Get order details
  async getOrderDetails(orderId) {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get PayPal order details')
      }

      return await response.json()
    } catch (error) {
      console.error('PayPal getOrderDetails error:', error)
      throw error
    }
  }

  // Refund payment
  async refundPayment(captureId, amount, noteToPayer) {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await fetch(`${this.baseUrl}/v2/payments/captures/${captureId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          amount: amount ? {
            currency_code: 'USD',
            value: amount.toFixed(2)
          } : undefined,
          note_to_payer: noteToPayer || 'Refund for mobile detailing service'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process PayPal refund')
      }

      return await response.json()
    } catch (error) {
      console.error('PayPal refundPayment error:', error)
      throw error
    }
  }

  // Format currency for display
  formatAmount(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  // Validate PayPal configuration
  validateConfig() {
    const errors = []

    if (!this.clientId || this.clientId === 'your_paypal_client_id') {
      errors.push('PayPal client ID is required')
    }

    if (!import.meta.env.PAYPAL_CLIENT_SECRET) {
      errors.push('PayPal client secret is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export default new PayPalService()
