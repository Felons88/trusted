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

  const sendPaymentReceipt = async (invoiceData, paymentIntent) => {
    try {
      // Get last 4 digits of card
      const last4 = paymentIntent.payment_method?.card?.last4 || '****'
      
      // Generate receipt HTML
      const receiptHTML = generateReceiptHTML(invoiceData, paymentIntent, last4)
      
      // Send email via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-payment-receipt', {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: {
          toEmail: invoiceData.clients?.email,
          subject: `Payment Receipt - Invoice ${invoiceData.invoice_number}`,
          html: receiptHTML,
          invoiceData: invoiceData,
          paymentIntent: paymentIntent
        }
      })

      if (error) {
        console.error('Email send error:', error)
        // Don't show error to user, just log it
      } else {
        console.log('Payment receipt email sent successfully')
      }
    } catch (error) {
      console.error('Failed to send payment receipt:', error)
    }
  }

  const generateReceiptHTML = (invoiceData, paymentIntent, last4) => {
    const items = invoiceData.invoice_items || []
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const tax = subtotal * 0.06875 // 6.875% tax rate
    const total = invoiceData.total || subtotal + tax

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt - Trusted Mobile Detailing</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            padding: 40px 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            background: white;
            padding: 40px 30px;
          }
          .receipt-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
          }
          .info-item h3 {
            margin: 0 0 5px 0;
            font-size: 12px;
            text-transform: uppercase;
            color: #888;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .info-item p {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #333;
          }
          .items-table {
            width: 100%;
            margin-bottom: 20px;
          }
          .items-table th {
            background: #f8f9fa;
            padding: 12px 16px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            color: #888;
            font-weight: 600;
            border-bottom: 2px solid #e9ecef;
          }
          .items-table td {
            padding: 16px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
          }
          .items-table .quantity {
            text-align: center;
            color: #666;
          }
          .items-table .price {
            text-align: right;
            font-weight: 600;
            color: #333;
          }
          .totals {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #f0f0f0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .total-row.grand-total {
            font-size: 18px;
            font-weight: 700;
            color: #1e3a8a;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #e9ecef;
          }
          .payment-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
          }
          .payment-info h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #333;
          }
          .payment-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .payment-details p {
            margin: 0;
            font-size: 14px;
          }
          .payment-details strong {
            color: #333;
          }
          .footer {
            padding: 30px;
            text-align: center;
            color: white;
            font-size: 12px;
          }
          .footer p {
            margin: 5px 0;
            opacity: 0.8;
          }
          .brand {
            font-weight: 700;
            font-size: 24px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">Trusted Mobile Detailing</div>
            <h1>Payment Receipt</h1>
            <p>Thank you for your payment! Your transaction has been processed successfully.</p>
          </div>
          
          <div class="content">
            <div class="receipt-info">
              <div class="info-item">
                <h3>Receipt Number</h3>
                <p>RCPT-${invoiceData.invoice_number}-${paymentIntent.id.slice(-8)}</p>
              </div>
              <div class="info-item">
                <h3>Payment Date</h3>
                <p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div class="info-item">
                <h3>Customer</h3>
                <p>${invoiceData.clients?.full_name || 'N/A'}</p>
              </div>
              <div class="info-item">
                <h3>Invoice Number</h3>
                <p>${invoiceData.invoice_number}</p>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Service Description</th>
                  <th class="quantity">Qty</th>
                  <th class="price">Price</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="quantity">${item.quantity}</td>
                    <td class="price">$${(item.unit_price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Tax (6.875%):</span>
                <span>$${tax.toFixed(2)}</span>
              </div>
              <div class="total-row grand-total">
                <span>Total Paid:</span>
                <span>$${total.toFixed(2)}</span>
              </div>
            </div>

            <div class="payment-info">
              <h3>Payment Information</h3>
              <div class="payment-details">
                <p><strong>Payment Method:</strong> Credit Card ending in ${last4}</p>
                <p><strong>Transaction ID:</strong> ${paymentIntent.id}</p>
                <p><strong>Status:</strong> <span style="color: #10b981;">✓ Paid</span></p>
                <p><strong>Amount:</strong> $${total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="brand">Trusted Mobile Detailing</div>
            <p>Professional Auto Detailing Services</p>
            <p>Questions? Contact us at support@trustedmobiledetailing.com</p>
            <p>This receipt serves as proof of payment for your records.</p>
          </div>
        </div>
      </body>
      </html>
    `
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
      console.log('Starting payment process...')
      console.log('Invoice data:', invoice)
      console.log('Payment amount:', Math.round((invoice?.total || 0) * 100))
      
      // Step 1: Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
        billing_details: {
          name: invoice?.clients?.full_name,
          email: invoice?.clients?.email,
        },
      })

      if (pmError) {
        console.error('Payment method creation error:', pmError)
        setError(pmError.message)
        setProcessing(false)
        return
      }

      console.log('Payment method created:', paymentMethod)

      // Step 2: Confirm payment with the payment method
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment({
        payment_method: paymentMethod.id,
        amount: Math.round((invoice?.total || 0) * 100), // Convert to cents
        currency: 'usd',
        description: `Invoice #${invoice?.invoice_number || id} - Trusted Mobile Detailing`,
        metadata: {
          invoice_id: id,
          invoice_number: invoice?.invoice_number || id,
        },
      })

      console.log('Payment result:', { paymentError, paymentIntent })

      if (paymentError) {
        console.error('Stripe payment error:', paymentError)
        setError(paymentError.message)
      } else if (paymentIntent) {
        console.log('Payment successful:', paymentIntent)
        
        // Update invoice status to paid
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id
          })
          .eq('id', id)

        if (updateError) {
          console.error('Invoice update error:', updateError)
          setError('Payment successful but failed to update invoice. Please contact support.')
        } else {
          console.log('Invoice updated successfully')
          
          // Send payment receipt email
          await sendPaymentReceipt(invoice, paymentIntent)
          
          setSuccess(true)
          setTimeout(() => {
            navigate('/success')
          }, 3000)
        }
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(`Payment failed: ${err.message || 'Unknown error'}`)
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
