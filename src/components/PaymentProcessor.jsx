import { useState, useEffect } from 'react'
import { CreditCard, Monitor, Loader2, Check, AlertCircle } from 'lucide-react'
import stripeService from '../services/stripeService'
import paypalService from '../services/paypalService'
import toast from 'react-hot-toast'

function PaymentProcessor({ amount, bookingId, customerEmail, onSuccess, onError }) {
  const [selectedMethod, setSelectedMethod] = useState('stripe')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [stripe, setStripe] = useState(null)
  const [elements, setElements] = useState(null)
  const [paypal, setPaypal] = useState(null)
  const [stripeElementLoading, setStripeElementLoading] = useState(false)

  // Initialize payment services
  useEffect(() => {
    initializePaymentServices()
  }, [])

  const initializePaymentServices = async () => {
    setLoading(true)
    try {
      // Initialize Stripe
      try {
        const stripeInstance = await stripeService.init()
        setStripe(stripeInstance)
      } catch (error) {
        console.error('Stripe initialization failed:', error)
      }

      // Initialize PayPal
      try {
        const paypalInstance = await paypalService.init()
        setPaypal(paypalInstance)
      } catch (error) {
        console.error('PayPal initialization failed:', error)
      }
    } catch (error) {
      console.error('Payment initialization error:', error)
      toast.error('Failed to initialize payment services')
    } finally {
      setLoading(false)
    }
  }

  // Handle Stripe payment
  const handleStripePayment = async () => {
    setProcessing(true)
    try {
      // Create payment intent
      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        bookingId,
        customerEmail
      )

      // Create payment elements
      const { elements: stripeElements, paymentElement } = stripeService.createPaymentElements(
        stripe,
        paymentIntent.client_secret
      )

      // Mount payment element
      const container = document.getElementById('stripe-payment-element')
      if (container) {
        container.innerHTML = '' // Clear previous content
        paymentElement.mount('#stripe-payment-element')
      }

      // Confirm payment
      const result = await stripeService.confirmPayment(
        stripe,
        stripeElements,
        paymentIntent.client_secret
      )

      onSuccess({
        method: 'stripe',
        paymentIntent: result,
        amount,
        bookingId
      })

      toast.success('Payment successful!')
    } catch (error) {
      console.error('Stripe payment error:', error)
      onError(error)
      toast.error(error.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  // Initialize Stripe payment element when Stripe is selected
  useEffect(() => {
    if (selectedMethod === 'stripe' && stripe) {
      initializeStripeElement()
    }
  }, [selectedMethod, stripe])

  const initializeStripeElement = async () => {
    setStripeElementLoading(true)
    try {
      // Create a dummy payment intent to get client secret for element initialization
      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        bookingId,
        customerEmail
      )

      // Create and mount payment element
      const { elements: stripeElements, paymentElement } = stripeService.createPaymentElements(
        stripe,
        paymentIntent.client_secret
      )

      const container = document.getElementById('stripe-payment-element')
      if (container && !container.hasChildNodes()) {
        paymentElement.mount('#stripe-payment-element')
      }
    } catch (error) {
      console.error('Error initializing Stripe element:', error)
      toast.error('Failed to load payment form')
    } finally {
      setStripeElementLoading(false)
    }
  }

  // Handle PayPal payment
  const handlePayPalPayment = async () => {
    if (!paypal) {
      toast.error('PayPal not properly initialized')
      return
    }

    setProcessing(true)
    try {
      // Create and render PayPal buttons
      await paypalService.renderPayPalButton(
        '#paypal-button-container',
        amount,
        bookingId,
        (captureData) => {
          onSuccess({
            method: 'paypal',
            captureData,
            amount,
            bookingId
          })
          toast.success('PayPal payment successful!')
        },
        (error) => {
          onError(error)
          toast.error(error.message || 'PayPal payment failed')
        }
      )
    } catch (error) {
      console.error('PayPal payment error:', error)
      onError(error)
      toast.error(error.message || 'PayPal payment failed')
    } finally {
      setProcessing(false)
    }
  }

  // Payment method selection
  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay with Visa, Mastercard, Amex, etc.',
      color: 'bg-blue-500'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: Monitor,
      description: 'Pay with your PayPal account',
      color: 'bg-blue-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin mr-2 text-blue-400" />
        <span className="text-gray-300">Initializing payment services...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Select Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/20 hover:border-white/40 bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full text-white ${method.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-white">{method.name}</div>
                    <div className="text-sm text-gray-400">{method.description}</div>
                  </div>
                </div>
                {selectedMethod === method.id && (
                  <Check className="text-blue-400 ml-auto" size={20} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Payment Forms */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/20 p-6 rounded-xl">
        {/* Stripe Payment Form */}
        {selectedMethod === 'stripe' && (
          <div className="space-y-4">
            <h4 className="font-medium text-white">Card Details</h4>
            <div className="min-h-[100px] bg-white/10 rounded-lg p-4 relative">
              {stripeElementLoading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="animate-spin mr-2 text-blue-400" />
                  <span className="text-gray-300">Loading payment form...</span>
                </div>
              ) : (
                <div id="stripe-payment-element">
                  {/* Stripe payment element will be mounted here */}
                </div>
              )}
            </div>
            <button
              onClick={handleStripePayment}
              disabled={processing || !stripe || stripeElementLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all disabled:cursor-not-allowed"
            >
              {processing ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2" />
                  Processing...
                </span>
              ) : (
                `Pay $${amount.toFixed(2)}`
              )}
            </button>
          </div>
        )}

        {/* PayPal Payment Form */}
        {selectedMethod === 'paypal' && (
          <div className="space-y-4">
            <h4 className="font-medium text-white">Pay with PayPal</h4>
            <div id="paypal-button-container" className="min-h-[100px] bg-white/10 rounded-lg p-4">
              {/* PayPal buttons will be rendered here */}
            </div>
            {!paypal && (
              <div className="text-center text-gray-400">
                <AlertCircle className="mx-auto mb-2" />
                <p>PayPal is not available at the moment</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Information */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/20 p-4 rounded-xl">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-blue-400 mt-1" size={20} />
          <div className="text-sm text-gray-300">
            <p className="font-medium text-white mb-1">Secure Payment Processing</p>
            <p>Your payment information is encrypted and secure. We never store your card details on our servers.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentProcessor
