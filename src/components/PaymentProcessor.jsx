import { useState, useEffect } from 'react'
import { CreditCard, Smartphone, Monitor, Loader2, Check, AlertCircle } from 'lucide-react'
import stripeService from '../services/stripeService'
import paypalService from '../services/paypalService'
import squareService from '../services/squareService'
import toast from 'react-hot-toast'

function PaymentProcessor({ amount, bookingId, customerEmail, onSuccess, onError }) {
  const [selectedMethod, setSelectedMethod] = useState('stripe')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [stripe, setStripe] = useState(null)
  const [elements, setElements] = useState(null)
  const [paypal, setPaypal] = useState(null)
  const [square, setSquare] = useState(null)
  const [squareCard, setSquareCard] = useState(null)

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

      // Initialize Square
      try {
        const squareInstance = await squareService.init()
        const { payments, card } = await squareService.initializePayments(squareInstance)
        setSquare(squareInstance)
        setSquareCard(card)
      } catch (error) {
        console.error('Square initialization failed:', error)
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
    if (!stripe || !elements) {
      toast.error('Stripe not properly initialized')
      return
    }

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

      // Mount payment element (if not already mounted)
      if (!document.getElementById('stripe-payment-element').hasChildNodes()) {
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

  // Handle Square payment
  const handleSquarePayment = async () => {
    if (!square || !squareCard) {
      toast.error('Square not properly initialized')
      return
    }

    setProcessing(true)
    try {
      // Tokenize card
      const token = await squareService.tokenize(squareCard)

      // Process payment
      const payment = await squareService.processPayment(
        token,
        amount,
        bookingId,
        customerEmail
      )

      onSuccess({
        method: 'square',
        payment,
        amount,
        bookingId
      })

      toast.success('Square payment successful!')
    } catch (error) {
      console.error('Square payment error:', error)
      onError(error)
      toast.error(error.message || 'Square payment failed')
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
    },
    {
      id: 'square',
      name: 'Square',
      icon: Smartphone,
      description: 'Mobile payment processing',
      color: 'bg-green-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin mr-2" />
        <span>Initializing payment services...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full text-white ${method.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-gray-500">{method.description}</div>
                  </div>
                </div>
                {selectedMethod === method.id && (
                  <Check className="text-blue-500 ml-auto" size={20} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Payment Forms */}
      <div className="bg-gray-50 p-6 rounded-lg">
        {/* Stripe Payment Form */}
        {selectedMethod === 'stripe' && (
          <div className="space-y-4">
            <h4 className="font-medium">Card Details</h4>
            <div id="stripe-payment-element" className="min-h-[100px]">
              {/* Stripe payment element will be mounted here */}
            </div>
            <button
              onClick={handleStripePayment}
              disabled={processing || !stripe}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <h4 className="font-medium">Pay with PayPal</h4>
            <div id="paypal-button-container" className="min-h-[100px]">
              {/* PayPal buttons will be rendered here */}
            </div>
            {!paypal && (
              <div className="text-center text-gray-500">
                <AlertCircle className="mx-auto mb-2" />
                <p>PayPal is not available at the moment</p>
              </div>
            )}
          </div>
        )}

        {/* Square Payment Form */}
        {selectedMethod === 'square' && (
          <div className="space-y-4">
            <h4 className="font-medium">Card Details (Square)</h4>
            <div id="card-container" className="min-h-[100px]">
              {/* Square card element will be mounted here */}
            </div>
            <button
              onClick={handleSquarePayment}
              disabled={processing || !square}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>

      {/* Security Information */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-blue-500 mt-1" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Secure Payment Processing</p>
            <p>Your payment information is encrypted and secure. We never store your card details on our servers.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentProcessor
