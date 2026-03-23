import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CreditCard, Smartphone, DollarSign, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

function InvoicePayment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardDetails, setCardDetails] = useState({
    number: '',
    exp_month: '',
    exp_year: '',
    cvv: '',
    name: ''
  })

  useEffect(() => {
    if (id) {
      fetchInvoice()
    }
  }, [id])

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id(id, full_name, email)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setInvoice(data)
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    setProcessing(true)

    try {
      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: id,
          client_id: invoice.client_id,
          amount: invoice.total,
          payment_method: paymentMethod,
          status: 'completed',
          transaction_id: `txn_${Date.now()}`,
          payment_date: new Date().toISOString()
        })

      if (paymentError) throw paymentError

      // Update invoice status
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', id)

      // Redirect to success page
      navigate('/admin/invoices', { 
        state: { message: 'Payment processed successfully!' } 
      })

    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-light-gray mb-2">Invoice not found</h3>
        <p className="text-light-gray mb-4">The invoice you're trying to pay doesn't exist.</p>
        <button 
          onClick={() => navigate('/admin/invoices')}
          className="btn-primary"
        >
          Back to Invoices
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-gradient py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/admin/invoices')}
            className="text-light-gray hover:text-electric-blue mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-light-gray">Payment</h1>
            <p className="text-light-gray">Complete your payment for invoice #{invoice.invoice_number || `INV-${invoice.id}`}</p>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-light-gray mb-4">Invoice Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-light-gray">Invoice Number:</span>
              <span className="text-light-gray">{invoice.invoice_number || `INV-${invoice.id}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-light-gray">Client:</span>
              <span className="text-light-gray">{invoice.clients?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-light-gray">Due Date:</span>
              <span className="text-light-gray">
                {invoice.due_date ? 
                  new Date(invoice.due_date).toLocaleDateString() : 
                  'No due date'
                }
              </span>
            </div>
            <div className="border-t border-navy-light pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-light-gray">Total Amount:</span>
                <span className="text-2xl font-bold text-green-400">
                  ${invoice.total?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-light-gray mb-6">Payment Method</h2>
          
          <form onSubmit={handlePayment}>
            {/* Payment Method Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'card' 
                    ? 'border-electric-blue bg-navy-light' 
                    : 'border-navy-light hover:border-navy'
                }`}
              >
                <CreditCard className="mx-auto mb-2 text-electric-blue" size={24} />
                <div className="text-light-gray">Credit Card</div>
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'paypal' 
                    ? 'border-electric-blue bg-navy-light' 
                    : 'border-navy-light hover:border-navy'
                }`}
              >
                <DollarSign className="mx-auto mb-2 text-blue-400" size={24} />
                <div className="text-light-gray">PayPal</div>
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'cash' 
                    ? 'border-electric-blue bg-navy-light' 
                    : 'border-navy-light hover:border-navy'
                }`}
              >
                <Smartphone className="mx-auto mb-2 text-green-400" size={24} />
                <div className="text-light-gray">Cash App</div>
              </button>
            </div>

            {/* Card Details */}
            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                    className="admin-input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Name on Card
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                    className="admin-input"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-2">
                      Exp Month
                    </label>
                    <select
                      value={cardDetails.exp_month}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, exp_month: e.target.value }))}
                      className="admin-select"
                      required
                    >
                      <option value="">MM</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                          {String(i + 1).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-2">
                      Exp Year
                    </label>
                    <select
                      value={cardDetails.exp_year}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, exp_year: e.target.value }))}
                      className="admin-select"
                      required
                    >
                      <option value="">YYYY</option>
                      {[...Array(10)].map((_, i) => (
                        <option key={new Date().getFullYear() + i} value={new Date().getFullYear() + i}>
                          {new Date().getFullYear() + i}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                      className="admin-input"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PayPal Option */}
            {paymentMethod === 'paypal' && (
              <div className="text-center py-8">
                <DollarSign className="mx-auto mb-4 text-blue-400" size={48} />
                <p className="text-light-gray mb-4">You will be redirected to PayPal to complete your payment.</p>
              </div>
            )}

            {/* Cash App Option */}
            {paymentMethod === 'cash' && (
              <div className="text-center py-8">
                <Smartphone className="mx-auto mb-4 text-green-400" size={48} />
                <p className="text-light-gray mb-4">You will be redirected to Cash App to complete your payment.</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Complete Payment - ${invoice.total?.toFixed(2) || '0.00'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Note */}
        <div className="text-center mt-6">
          <p className="text-sm text-light-gray">
            <AlertCircle className="inline mr-1" size={16} />
            Your payment information is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  )
}

export default InvoicePayment
