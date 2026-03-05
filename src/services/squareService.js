// Square Payment Service
// Handles Square payments for in-person transactions and mobile payments

class SquareService {
  constructor() {
    this.applicationId = import.meta.env.VITE_SQUARE_APPLICATION_ID
    this.locationId = import.meta.env.SQUARE_LOCATION_ID
    this.accessToken = import.meta.env.SQUARE_ACCESS_TOKEN
    this.baseUrl = 'https://connect.squareup.com'
  }

  // Initialize Square Web Payments SDK
  async init() {
    if (!this.applicationId || this.applicationId === 'your_square_application_id') {
      throw new Error('Square application ID not configured')
    }

    if (!this.locationId || this.locationId === 'your_square_location_id') {
      throw new Error('Square location ID not configured')
    }

    return new Promise((resolve, reject) => {
      if (window.Square) {
        resolve(window.Square)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://web.squarecdn.com/v1/square.js'
      script.onload = () => resolve(window.Square)
      script.onerror = () => reject(new Error('Failed to load Square SDK'))
      document.head.appendChild(script)
    })
  }

  // Initialize Square payments
  async initializePayments(square) {
    try {
      const payments = square.payments(this.applicationId, this.locationId)
      
      // Create card payment method
      const card = await payments.card()
      
      // Attach card to DOM
      await card.attach('#card-container')
      
      return { payments, card }
    } catch (error) {
      console.error('Square initializePayments error:', error)
      throw error
    }
  }

  // Create payment token
  async tokenize(card) {
    try {
      const result = await card.tokenize()
      
      if (result.status === 'OK') {
        return result.token
      } else {
        throw new Error(result.errors?.[0]?.message || 'Payment tokenization failed')
      }
    } catch (error) {
      console.error('Square tokenize error:', error)
      throw error
    }
  }

  // Process payment
  async processPayment(token, amount, bookingId, customerEmail) {
    try {
      const response = await fetch('/api/square/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId: token,
          amountMoney: {
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'USD'
          },
          idempotencyKey: `booking_${bookingId}_${Date.now()}`,
          referenceId: bookingId,
          buyerEmailAddress: customerEmail,
          note: 'Mobile detailing service payment'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process Square payment')
      }

      return await response.json()
    } catch (error) {
      console.error('Square processPayment error:', error)
      throw error
    }
  }

  // Create customer
  async createCustomer(email, firstName, lastName, phone) {
    try {
      const response = await fetch(`${this.baseUrl}/v2/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          given_name: firstName,
          family_name: lastName,
          email_address: email,
          phone_number: phone,
          reference_id: `customer_${Date.now()}`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create Square customer')
      }

      return await response.json()
    } catch (error) {
      console.error('Square createCustomer error:', error)
      throw error
    }
  }

  // Get customer by ID
  async getCustomer(customerId) {
    try {
      const response = await fetch(`${this.baseUrl}/v2/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get Square customer')
      }

      return await response.json()
    } catch (error) {
      console.error('Square getCustomer error:', error)
      throw error
    }
  }

  // Create order
  async createOrder(bookingId, lineItems, customerEmail) {
    try {
      const response = await fetch(`${this.baseUrl}/v2/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idempotencyKey: `order_${bookingId}_${Date.now()}`,
          referenceId: bookingId,
          lineItems: lineItems.map(item => ({
            quantity: item.quantity.toString(),
            catalogObjectId: item.catalogObjectId,
            modifiers: item.modifiers || [],
            basePriceMoney: {
              amount: Math.round(item.price * 100),
              currency: 'USD'
            }
          })),
          metadata: {
            bookingId,
            customerEmail
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create Square order')
      }

      return await response.json()
    } catch (error) {
      console.error('Square createOrder error:', error)
      throw error
    }
  }

  // Process refund
  async refundPayment(paymentId, amount, reason) {
    try {
      const response = await fetch(`${this.baseUrl}/v2/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idempotencyKey: `refund_${paymentId}_${Date.now()}`,
          amountMoney: {
            amount: Math.round(amount * 100),
            currency: 'USD'
          },
          paymentId: paymentId,
          reason: reason || 'Customer requested refund',
          appId: this.applicationId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process Square refund')
      }

      return await response.json()
    } catch (error) {
      console.error('Square refundPayment error:', error)
      throw error
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId) {
    try {
      const response = await fetch(`${this.baseUrl}/v2/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get Square payment status')
      }

      return await response.json()
    } catch (error) {
      console.error('Square getPaymentStatus error:', error)
      throw error
    }
  }

  // Create catalog item for detailing services
  async createCatalogItem(serviceName, price, description) {
    try {
      const response = await fetch(`${this.baseUrl}/v2/catalog/object`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'ITEM',
          idempotencyKey: `service_${serviceName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
          itemData: {
            name: serviceName,
            description: description,
            category: 'SERVICE',
            variations: [{
              type: 'FIXED_PRICING',
              fixedPricingMoney: {
                amount: Math.round(price * 100),
                currency: 'USD'
              }
            }]
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create Square catalog item')
      }

      return await response.json()
    } catch (error) {
      console.error('Square createCatalogItem error:', error)
      throw error
    }
  }

  // Get location details
  async getLocationDetails() {
    try {
      const response = await fetch(`${this.baseUrl}/v2/locations/${this.locationId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get Square location details')
      }

      return await response.json()
    } catch (error) {
      console.error('Square getLocationDetails error:', error)
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

  // Validate Square configuration
  validateConfig() {
    const errors = []

    if (!this.applicationId || this.applicationId === 'your_square_application_id') {
      errors.push('Square application ID is required')
    }

    if (!this.locationId || this.locationId === 'your_square_location_id') {
      errors.push('Square location ID is required')
    }

    if (!this.accessToken || this.accessToken === 'your_square_access_token') {
      errors.push('Square access token is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Handle payment errors
  handlePaymentError(error) {
    const errorMessages = {
      'INVALID_CARD': 'The card information is invalid',
      'CARD_EXPIRED': 'The card has expired',
      'INSUFFICIENT_FUNDS': 'Insufficient funds on the card',
      'CARD_DECLINED': 'The card was declined',
      'PROCESSING_ERROR': 'Payment processing error',
      'INVALID_EXPIRATION': 'Invalid expiration date',
      'INVALID_CVC': 'Invalid security code'
    }

    return errorMessages[error.code] || error.message || 'Payment failed'
  }
}

export default new SquareService()
