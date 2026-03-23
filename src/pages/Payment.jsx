import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, Shield, CheckCircle, AlertCircle, ArrowLeft, Clock, DollarSign, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

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
          clients (*),
          invoice_items (*)
        `)
        .eq('id', id)
        .single()

      clearTimeout(timeoutId)

      if (error) {
        console.error('Invoice fetch error:', error)
        setError('Failed to load invoice details')
      } else {
        console.log('Invoice fetched successfully:', data)
        setInvoice(data)
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

  const calculateFees = (baseAmount) => {
    // Stripe processing fees (typical for US)
    const stripeFixedFee = 0.30 // 30 cents fixed fee
    const stripePercentageFee = 0.029 // 2.9% percentage fee
    
    // Platform fee (4%)
    const platformFeeRate = 0.04
    
    // Calculate Stripe fees
    const stripeFee = stripeFixedFee + (baseAmount * stripePercentageFee)
    
    // Calculate platform fee
    const platformFee = baseAmount * platformFeeRate
    
    // Total fees
    const totalFees = stripeFee + platformFee
    
    // Final amount to charge customer
    const finalAmount = baseAmount + totalFees
    
    return {
      baseAmount,
      stripeFee,
      platformFee,
      totalFees,
      finalAmount,
      stripeFixedFee,
      stripePercentageFee: stripePercentageFee * 100,
      platformFeeRate: platformFeeRate * 100
    }
  }

  const sendPaymentReceipt = async (invoiceData, paymentIntent, fees) => {
    try {
      // Get last 4 digits of card
      const last4 = paymentIntent.payment_method?.card?.last4 || '****'
      
      // Generate receipt HTML
      const receiptHTML = generateReceiptHTML(invoiceData, paymentIntent, last4, fees)
      
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

  const generateReceiptHTML = (invoiceData, paymentIntent, last4, fees) => {
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
          .fees-section {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .fees-section h3 {
            margin: 0 0 15px 0;
            color: #856404;
            font-size: 16px;
            font-weight: 600;
          }
          .fee-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .fee-item:last-child {
            margin-bottom: 0;
            padding-top: 8px;
            border-top: 1px solid #ffeaa7;
            font-weight: 600;
          }
          .fee-item .fee-name {
            color: #856404;
          }
          .fee-item .fee-amount {
            color: #856404;
            font-weight: 600;
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

            <div class="fees-section">
              <h3>Processing Fees</h3>
              <div class="fee-item">
                <span class="fee-name">Invoice Amount:</span>
                <span class="fee-amount">$${fees.baseAmount.toFixed(2)}</span>
              </div>
              <div class="fee-item">
                <span class="fee-name">Stripe Processing Fee (${fees.stripePercentageFee.toFixed(1)}% + $${fees.stripeFixedFee.toFixed(2)}):</span>
                <span class="fee-amount">$${fees.stripeFee.toFixed(2)}</span>
              </div>
              <div class="fee-item">
                <span class="fee-name">Platform Fee (${fees.platformFeeRate.toFixed(1)}%):</span>
                <span class="fee-amount">$${fees.platformFee.toFixed(2)}</span>
              </div>
              <div class="fee-item">
                <span class="fee-name">Total Fees:</span>
                <span class="fee-amount">$${fees.totalFees.toFixed(2)}</span>
              </div>
            </div>

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
                <span>Total Charged:</span>
                <span>$${fees.finalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div class="payment-info">
              <h3>Payment Information</h3>
              <div class="payment-details">
                <p><strong>Payment Method:</strong> Credit Card ending in ${last4}</p>
                <p><strong>Transaction ID:</strong> ${paymentIntent.id}</p>
                <p><strong>Status:</strong> <span style="color: #10b981;">✓ Paid</span></p>
                <p><strong>Amount Charged:</strong> $${fees.finalAmount.toFixed(2)}</p>
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
      
      // Calculate fees
      const baseAmount = invoice?.total || 0
      const fees = calculateFees(baseAmount)
      console.log('Payment fees calculated:', fees)
      console.log('Base amount:', baseAmount)
      console.log('Final amount to charge:', fees.finalAmount)
      
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

      console.log('Payment method created:', paymentMethod.id)

      // Step 2: Create payment intent with fees
      const { error: piError, paymentIntent } = await stripe.confirmPayment({
        elements: elements.getElement(CardElement),
        amount: Math.round(fees.finalAmount * 100), // Convert to cents
        currency: 'usd',
        return_url: `${window.location.origin}/success`,
        cancel_url: `${window.location.origin}/payment/${id}?cancelled=true`,
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          base_amount: baseAmount.toString(),
          stripe_fees: fees.stripeFee.toString(),
          platform_fees: fees.platformFee.toString(),
          total_fees: fees.totalFees.toString(),
        },
      })

      if (piError) {
        console.error('Payment intent creation error:', piError)
        setError(piError.message)
        setProcessing(false)
        return
      }

      console.log('Payment intent created:', paymentIntent)

      // Step 3: The payment intent is already confirmed by confirmPayment
      const { error: confirmError, paymentIntent: confirmedIntent } = paymentIntent

      if (confirmError) {
        console.error('Payment confirmation error:', confirmError)
        setError(confirmError.message)
        setProcessing(false)
        return
      }

      console.log('Payment confirmed:', confirmedIntent)

      // Update invoice status to paid
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: confirmedIntent.id,
          base_amount: baseAmount,
          stripe_fees: fees.stripeFee,
          platform_fees: fees.platformFee,
          total_fees: fees.totalFees,
          total_charged: fees.finalAmount
        })
        .eq('id', id)

      if (updateError) {
        console.error('Invoice update error:', updateError)
        setError('Payment successful but failed to update invoice. Please contact support.')
      } else {
        console.log('Invoice updated successfully')
        
        // Send payment receipt email with fees
        await sendPaymentReceipt(invoice, confirmedIntent, fees)
        
        setSuccess(true)
        setTimeout(() => {
          navigate('/success')
        }, 3000)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 border-t-transparent"></div>
          <p className="mt-4 text-slate-300">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md border border-white/20">
            <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
            <p className="text-slate-300 mb-6">{error}</p>
            <button
              onClick={() => navigate('/invoices')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md border border-white/20">
            <CheckCircle className="text-green-400 mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold text-white mb-4">Payment Successful!</h1>
            <p className="text-slate-300">Your payment has been processed successfully.</p>
            <p className="text-slate-400 text-sm mt-2">You will be redirected shortly...</p>
          </div>
        </div>
      </div>
    )
  }

  const items = invoice?.invoice_items || []
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const total = invoice?.total || subtotal
  const fees = calculateFees(total)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/invoices')}
              className="text-slate-300 hover:text-white transition-colors flex items-center space-x-2"
            >
              <ArrowLeft size={20} />
              <span>Back to Invoices</span>
            </button>
            <div className="flex items-center space-x-2">
              <Shield className="text-blue-400" size={24} />
              <span className="text-white font-semibold">Secure Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Header */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">Invoice #{invoice?.invoice_number}</h1>
                  <p className="text-slate-400">Trusted Mobile Detailing</p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    invoice?.status === 'paid' ? 'bg-green-500/20 text-green-400' : 
                    invoice?.status === 'sent' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {invoice?.status?.toUpperCase() || 'DRAFT'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Client</p>
                  <p className="text-white font-semibold">{invoice?.clients?.full_name}</p>
                  <p className="text-slate-300 text-sm">{invoice?.clients?.email}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Date</p>
                  <p className="text-white font-semibold">{new Date(invoice?.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Services Table */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6">Services</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 text-slate-400 font-semibold">Service</th>
                      <th className="text-center py-3 px-4 text-slate-400 font-semibold">Qty</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-semibold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b border-white/10">
                        <td className="py-3 px-4 text-white">{item.description}</td>
                        <td className="py-3 px-4 text-center text-slate-300">{item.quantity}</td>
                        <td className="py-3 px-4 text-right text-white font-semibold">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2" className="py-3 px-4 text-slate-400 font-semibold">Subtotal</td>
                      <td className="py-3 px-4 text-right text-white font-semibold">${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="py-3 px-4 text-slate-400 font-semibold">Tax (6.875%)</td>
                      <td className="py-3 px-4 text-right text-white font-semibold">${(subtotal * 0.06875).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="py-3 px-4 text-slate-400 font-semibold">Invoice Amount</td>
                      <td className="py-3 px-4 text-right text-white font-semibold">${total.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="py-3 px-4 text-slate-400">Stripe Processing Fee (2.9% + $0.30)</td>
                      <td className="py-3 px-4 text-right text-slate-300">${fees.stripeFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="py-3 px-4 text-slate-400">Platform Fee (4%)</td>
                      <td className="py-3 px-4 text-right text-slate-300">${fees.platformFee.toFixed(2)}</td>
                    </tr>
                    <tr className="border-t border-white/20">
                      <td colSpan="2" className="py-4 px-4 text-white font-bold text-lg">Total Charged</td>
                      <td className="py-4 px-4 text-right text-blue-400 font-bold text-xl">${fees.finalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <DollarSign className="text-white" size={24} />
                <h2 className="text-xl font-bold text-white">Payment Summary</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Invoice Amount:</span>
                  <span className="text-white font-semibold">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Processing Fees:</span>
                  <span className="text-white font-semibold">${fees.totalFees.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/20 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-lg">Total:</span>
                    <span className="text-white font-bold text-xl">${fees.finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-3 mb-6">
                  <CreditCard className="text-blue-400" size={24} />
                  <h2 className="text-xl font-bold text-white">Payment Information</h2>
                </div>
                
                <div className="mb-6">
                  <label className="block text-slate-300 mb-3 font-semibold">
                    Card Information
                  </label>
                  <div className="bg-white/5 border border-white/20 rounded-lg p-4">
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
                  <div className="flex items-center mt-3 text-slate-400 text-sm">
                    <Lock size={16} className="mr-2" />
                    Your payment information is encrypted and secure
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle size={20} className="text-red-400" />
                      <p className="text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processing || !stripe}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white border-t-transparent"></div>
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <Shield size={20} />
                      <span>Pay ${fees.finalAmount.toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Security Info */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="text-green-400" size={20} />
                <h3 className="text-lg font-bold text-white">Secure Payment</h3>
              </div>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>256-bit SSL encryption</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>PCI DSS compliant</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Fraud protection</span>
                </li>
              </ul>
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
