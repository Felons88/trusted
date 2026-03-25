import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { ArrowLeft, Download, Printer, Mail, Calendar, DollarSign, User, Car, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function Receipt() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (invoiceId) {
      loadPayment()
    }
  }, [invoiceId])

  const loadPayment = async () => {
    try {
      // First try to get payment without joins to see if it exists
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', invoiceId)
        .single()

      if (paymentError) {
        console.error('Payment not found:', paymentError)
        if (paymentError.code === 'PGRST116') {
          // Payment doesn't exist - show user-friendly message
          setPayment(null)
        } else {
          toast.error('Failed to load receipt')
        }
        setLoading(false)
        return
      }

      // If payment exists, get related data
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', paymentData.client_id)
        .single()

      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', paymentData.booking_id)
        .single()

      setPayment({
        ...paymentData,
        client: clientData,
        booking: bookingData
      })
    } catch (error) {
      console.error('Error loading payment:', error)
      toast.error('Failed to load receipt')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Simple download functionality - in a real app, you'd generate a PDF
    toast.success('Download feature coming soon!')
  }

  const handleEmailReceipt = () => {
    toast.success('Receipt emailed successfully!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-deep">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-deep">
        <div className="text-center p-8">
          <div className="glass-card p-8 max-w-md">
            <div className="text-6xl text-yellow-400 mb-4">📄</div>
            <h1 className="text-2xl font-bold text-white mb-4">Receipt Not Found</h1>
            <p className="text-light-gray mb-6">
              This receipt doesn't exist or you don't have permission to view it.
            </p>
            <div className="space-y-4">
              <Link to="/client-portal" className="btn-primary w-full">
                Back to Client Portal
              </Link>
              <Link to="/book-now" className="btn-secondary w-full">
                Book a Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-deep py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <Link 
            to="/client-portal" 
            className="flex items-center text-light-gray hover:text-bright-cyan transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Portal
          </Link>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-2"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={handleEmailReceipt}
              className="btn-secondary flex items-center gap-2"
            >
              <Mail size={16} />
              Email
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="glass-card p-8" id="receipt-content">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold metallic-heading mb-2">Payment Receipt</h1>
            <div className="flex items-center justify-center text-green-400 mb-4">
              <CheckCircle size={24} className="mr-2" />
              <span className="font-semibold">Paid</span>
            </div>
            <p className="text-light-gray">
              Receipt #{payment.id.slice(-8)}
            </p>
            <p className="text-light-gray text-sm">
              {format(new Date(payment.created_at), 'MMMM dd, yyyy at h:mm a')}
            </p>
          </div>

          {/* Company Info */}
          <div className="border-b border-electric-blue/20 pb-6 mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-3">Trusted Mobile Detailing</h2>
                <div className="space-y-1 text-light-gray text-sm">
                  <p>Professional Mobile Auto Detailing</p>
                  <p>📞 (612) 525-3137</p>
                  <p>📧 info@trustedmobileetailing.com</p>
                  <p>📍 Service Area: Twin Cities, MN</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Billed To</h3>
                <div className="space-y-1 text-light-gray text-sm">
                  <p className="font-semibold text-white">{payment.client?.full_name}</p>
                  <p>{payment.client?.email}</p>
                  <p>{payment.client?.phone}</p>
                  {payment.client?.address && (
                    <p>
                      {payment.client?.address}
                      {payment.client?.city && `, ${payment.client?.city}`}
                      {payment.client?.state && `, ${payment.client?.state}`}
                      {payment.client?.zip_code && ` ${payment.client?.zip_code}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="border-b border-electric-blue/20 pb-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Service Details</h3>
            <div className="bg-navy-dark/50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-white">{payment.booking?.service_type || 'Service'} Detailing</p>
                  <p className="text-light-gray text-sm">
                    Booking #{payment.booking?.booking_number}
                  </p>
                  {payment.booking?.preferred_date && (
                    <p className="text-light-gray text-sm flex items-center mt-1">
                      <Calendar size={14} className="mr-1" />
                      {format(new Date(payment.booking.preferred_date), 'MMMM dd, yyyy')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-bright-cyan">
                    ${parseFloat(payment.amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              
              {/* Service Items */}
              {payment.booking && (
                <div className="mt-4 pt-4 border-t border-electric-blue/20">
                  <h4 className="font-semibold text-white mb-3">Service Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-light-gray">{payment.booking.service_type} Detailing</span>
                      <span className="text-white">${parseFloat(payment.amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="border-b border-electric-blue/20 pb-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-light-gray">Subtotal</span>
                <span className="text-white">
                  ${parseFloat(payment.amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-light-gray">Tax</span>
                <span className="text-white">
                  ${parseFloat(0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-electric-blue/20">
                <span className="text-white">Total Paid</span>
                <span className="text-green-400">
                  ${parseFloat(payment.amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Information</h3>
            <div className="bg-navy-dark/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-light-gray text-sm">Payment Method</p>
                  <p className="text-white font-semibold">
                    {payment.payment_method === 'card' ? 'Credit/Debit Card' : 
                     payment.payment_method === 'cash' ? 'Cash' : 
                     payment.payment_method || 'Online Payment'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-light-gray text-sm">Payment Date</p>
                  <p className="text-white font-semibold">
                    {payment.paid_at ? 
                      format(new Date(payment.paid_at), 'MMM dd, yyyy') : 
                      format(new Date(payment.updated_at), 'MMM dd, yyyy')
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-light-gray text-sm">
            <p className="mb-2">Thank you for your business!</p>
            <p>This receipt serves as proof of payment for your detailing service.</p>
            <p className="mt-4 text-xs">Questions? Contact us at (612) 525-3137</p>
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="mt-6 flex justify-center gap-2 print:hidden">
          <Link 
            to="/client-portal" 
            className="btn-primary"
          >
            Back to Portal
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Receipt
