import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Hardcode the Stripe key to bypass build cache issues
const stripePromise = loadStripe('pk_live_51TEEY4KQoiN8mHgUcg9sArq8iMJjYpigcgKpYzUFIALtPtFnkV6mc96PFVdvE56nkAFrlb36I8QDuGwr3uyiMzCC00IxrT0w4Z')

function PaymentContent() {
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  const { id } = useParams()
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()

  useEffect(() => {
    console.log('Payment component loaded, invoiceId:', id)
    if (id) {
      fetchInvoice()
    } else {
      console.error('No invoiceId provided')
      setError('No invoice ID provided')
      setLoading(false)
    }
  }, [id])

  const fetchInvoice = async () => {
    console.log('Fetching invoice with ID:', id)
    setLoading(true)
    
    try {
      // Add timeout to the fetch request itself
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id(full_name, email, address),
          invoice_items(*)
        `)
        .eq('id', id)
        .single()
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)
      console.log('Invoice fetch result:', { data, error })

      if (error) {
        console.error('Invoice fetch error:', error)
        setError(`Invoice not found: ${error.message}`)
      } else if (data) {
        console.log('Invoice loaded successfully:', data)
        setInvoice(data)
      } else {
        console.error('No invoice data returned')
        setError('Invoice not found')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else {
        setError('Failed to load invoice')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setProcessing(true)
    setError(null)

    if (!stripe || !elements) {
      setError('Payment system not available')
      setProcessing(false)
      return
    }

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: invoice?.clients?.full_name,
              email: invoice?.clients?.email,
            },
          },
          amount: Math.round((invoice?.total || 0) * 100), // Convert to cents
          currency: 'usd',
          description: `Invoice #${invoice?.invoice_number || id} - Trusted Mobile Detailing`,
          metadata: {
            invoice_id: id,
            invoice_number: invoice?.invoice_number || id,
          },
        },
      })

      if (paymentError) {
        setError(paymentError.message)
      } else if (paymentIntent) {
        // Update invoice status to paid
        await supabase
          .from('invoices')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id
          })
          .eq('id', id)

        setSuccess(true)
        setTimeout(() => {
          navigate('/success')
        }, 3000)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-deep">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue border-t-transparent"></div>
          <p className="mt-4 text-light-gray">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-deep">
        <div className="text-center p-8">
          <div className="glass-card p-8 max-w-md">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
            <p className="text-light-gray">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary mt-4"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-deep">
        <div className="text-center p-8">
          <div className="glass-card p-8 max-w-md">
            <div className="text-6xl text-green-400 mb-4">✓</div>
            <h1 className="text-2xl font-bold text-white mb-4">Payment Successful!</h1>
            <p className="text-light-gray mb-6">
              Thank you for your payment. Your invoice has been marked as paid.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const items = invoice?.invoice_items || []
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const total = invoice?.total || subtotal

  return (
    <div className="min-h-screen bg-navy-deep py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-8 mb-8">
            <h1 className="text-3xl font-bold text-center mb-8 metallic-heading">
              Invoice Payment
            </h1>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">Invoice Details</h2>
                <div className="bg-navy-dark p-4 rounded-lg">
                  <p><strong>Invoice #:</strong> {invoice?.invoice_number || id}</p>
                  <p><strong>Date:</strong> {new Date(invoice?.created_at).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> 
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      invoice?.status === 'paid' ? 'bg-green-500' : 
                      invoice?.status === 'sent' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      {invoice?.status?.toUpperCase() || 'DRAFT'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">Billing Information</h2>
                <div className="bg-navy-dark p-4 rounded-lg">
                  <p><strong>Name:</strong> {invoice?.clients?.full_name}</p>
                  <p><strong>Email:</strong> {invoice?.clients?.email}</p>
                  {invoice?.clients?.address && (
                    <p><strong>Address:</strong> {invoice.clients.address}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Services</h2>
              <div className="bg-navy-dark rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-electric-blue">
                        <th className="text-left p-3 text-light-gray">Service Description</th>
                        <th className="text-right p-3 text-light-gray">Quantity</th>
                        <th className="text-right p-3 text-light-gray">Unit Price</th>
                        <th className="text-right p-3 text-light-gray">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-700">
                          <td className="p-3 text-light-gray">{item.description}</td>
                          <td className="p-3 text-right text-light-gray">{item.quantity}</td>
                          <td className="p-3 text-right text-light-gray">${item.unit_price.toFixed(2)}</td>
                          <td className="p-3 text-right text-light-gray font-semibold">
                            ${(item.quantity * item.unit_price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-electric-blue">
                        <td colSpan="3" className="p-3 text-right text-light-gray font-bold">
                          Total:
                        </td>
                        <td className="p-3 text-right text-xl font-bold text-electric-blue">
                          ${total.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-navy-dark p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-6">Payment Information</h2>
                
                <div className="mb-6">
                  <label className="block text-light-gray mb-2 font-semibold">
                    Card Information
                  </label>
                  <div className="bg-navy-deep p-4 rounded-lg">
                    <CardElement 
                      options={{
                        style: {
                          base: {
                            color: '#fff',
                            fontSize: '16px',
                            '::placeholder': {
                              color: '#9ca3af',
                            },
                          },
                        }
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
                    <p className="text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processing || !stripe}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white border-t-transparent mr-3"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      💳 Pay ${total.toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="text-center mt-8 text-light-gray text-sm">
              <p>Secure payment processing powered by Stripe</p>
              <p className="mt-2">
                Questions? Contact us at (612) 525-3137 or info@trustedmobiledetailing.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrapper component that provides Stripe Elements context
function Payment() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentContent />
    </Elements>
  )
}

export default Payment
