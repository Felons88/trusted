import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  MapPin,
  Shield,
  Activity,
  User,
  Calendar,
  DollarSign,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

function PaymentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [paymentAttempt, setPaymentAttempt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (id) {
      fetchPaymentAttempt(id)
    }
  }, [id])

  const fetchPaymentAttempt = async (attemptId) => {
    try {
      console.log('Fetching payment attempt details for:', attemptId)
      
      const { data, error } = await supabase
        .from('payment_attempts')
        .select(`
          *,
          invoices:invoice_id (
            *,
            clients:client_id (*),
            invoice_items (*)
          ),
          payment_details (*),
          fraud_detection (*),
          payment_status_updates (*)
        `)
        .eq('id', attemptId)
        .single()

      if (error) {
        console.error('Error fetching payment attempt:', error)
        throw error
      }
      
      console.log('Payment attempt data:', data)
      setPaymentAttempt(data)
    } catch (error) {
      console.error('Error fetching payment attempt:', error)
      toast.error('Failed to load payment details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle size={20} className="text-green-400" />
      case 'pending':
        return <Clock size={20} className="text-yellow-400" />
      case 'failed':
        return <XCircle size={20} className="text-red-400" />
      case 'processing':
        return <RefreshCw size={20} className="text-blue-400" />
      default:
        return <Clock size={20} className="text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'normal':
        return 'text-green-400'
      case 'elevated':
        return 'text-yellow-400'
      case 'high':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const formatLocation = (location) => {
    if (!location) return 'Unknown'
    const parts = []
    if (location.city) parts.push(location.city)
    if (location.region) parts.push(location.region)
    if (location.country) parts.push(location.country)
    return parts.join(', ') || 'Unknown'
  }

  const formatFraudSignals = (signals) => {
    try {
      const parsed = typeof signals === 'string' ? JSON.parse(signals) : signals
      if (!Array.isArray(parsed)) return 'None'
      return parsed.map((s, idx) => (
        <div key={idx} className="text-sm text-gray-300">
          • {s.description || s.type}
        </div>
      ))
    } catch {
      return <div className="text-sm text-gray-300">None</div>
    }
  }

  const downloadPaymentData = () => {
    if (!paymentAttempt) return
    
    const data = {
      payment_attempt: paymentAttempt,
      payment_details: paymentAttempt.payment_details,
      fraud_detection: paymentAttempt.fraud_detection,
      status_updates: paymentAttempt.payment_status_updates,
      invoice: paymentAttempt.invoices
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payment-${paymentAttempt.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Payment data downloaded')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!paymentAttempt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Payment Not Found</h2>
          <p className="text-gray-400 mb-4">The payment attempt you're looking for doesn't exist.</p>
          <Link
            to="/admin/payments"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Payments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/payments')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Payment Details</h1>
            <p className="text-gray-400">
              Invoice #{paymentAttempt.invoices?.invoice_number} • 
              Payment ID: {paymentAttempt.stripe_payment_intent_id?.slice(-8)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadPaymentData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Download Data
          </button>
          <button
            onClick={() => fetchPaymentAttempt(id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              {getStatusIcon(paymentAttempt.status)}
            </div>
            <h3 className="text-lg font-semibold text-white">Status</h3>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(paymentAttempt.status)}`}>
              {paymentAttempt.status}
            </span>
          </div>
          <div className="text-center">
            <DollarSign className="text-green-400 mx-auto mb-2" size={24} />
            <h3 className="text-lg font-semibold text-white">Amount</h3>
            <p className="text-2xl font-bold text-green-400">
              ${parseFloat(paymentAttempt.amount).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <Shield className={`mx-auto mb-2 ${getRiskColor(paymentAttempt.fraud_detection?.risk_level)}`} size={24} />
            <h3 className="text-lg font-semibold text-white">Risk Level</h3>
            <p className={`text-xl font-bold ${getRiskColor(paymentAttempt.fraud_detection?.risk_level)}`}>
              {paymentAttempt.fraud_detection?.risk_level || 'Unknown'}
            </p>
            {paymentAttempt.fraud_detection?.fraud_score && (
              <p className="text-sm text-gray-400">
                Score: {paymentAttempt.fraud_detection.fraud_score}
              </p>
            )}
          </div>
          <div className="text-center">
            <MapPin className="text-gray-400 mx-auto mb-2" size={24} />
            <h3 className="text-lg font-semibold text-white">Location</h3>
            <p className="text-sm text-gray-300">
              {formatLocation(paymentAttempt.location)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
        <div className="flex border-b border-white/20">
          {['overview', 'payment', 'fraud', 'timeline'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User size={18} />
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <p><span className="text-gray-400">Name:</span> {paymentAttempt.invoices?.clients?.full_name || 'Unknown'}</p>
                  <p><span className="text-gray-400">Email:</span> {paymentAttempt.invoices?.clients?.email || 'No email'}</p>
                  <p><span className="text-gray-400">Invoice:</span> {paymentAttempt.invoices?.invoice_number}</p>
                  <p><span className="text-gray-400">Created:</span> {new Date(paymentAttempt.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CreditCard size={18} />
                  Payment Information
                </h3>
                <div className="space-y-2">
                  <p><span className="text-gray-400">Method:</span> {paymentAttempt.payment_method}</p>
                  <p><span className="text-gray-400">Card:</span> {paymentAttempt.card_brand} ****{paymentAttempt.card_last4}</p>
                  <p><span className="text-gray-400">IP Address:</span> {paymentAttempt.ip_address}</p>
                  <p><span className="text-gray-400">Payment Intent:</span> {paymentAttempt.stripe_payment_intent_id}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard size={18} />
                Payment Attempt Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">Transaction Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-400">Payment Intent ID:</span> {paymentAttempt.stripe_payment_intent_id || 'Not created'}</p>
                    <p><span className="text-gray-400">Payment Method:</span> {paymentAttempt.payment_method}</p>
                    <p><span className="text-gray-400">Card Brand:</span> {paymentAttempt.card_brand || 'Unknown'}</p>
                    <p><span className="text-gray-400">Card Last 4:</span> {paymentAttempt.card_last4 ? `****${paymentAttempt.card_last4}` : 'Unknown'}</p>
                    <p><span className="text-gray-400">Card Expiry:</span> {
                      paymentAttempt.card_exp_month && paymentAttempt.card_exp_year 
                        ? `${paymentAttempt.card_exp_month}/${paymentAttempt.card_exp_year}` 
                        : 'Unknown'
                    }</p>
                    <p><span className="text-gray-400">Card Funding:</span> {paymentAttempt.card_funding || 'Unknown'}</p>
                    <p><span className="text-gray-400">Card Country:</span> {paymentAttempt.card_country || 'Unknown'}</p>
                    <p><span className="text-gray-400">Card Fingerprint:</span> 
                      <span className="text-xs text-gray-400 ml-2 font-mono">
                        {paymentAttempt.card_fingerprint ? `${paymentAttempt.card_fingerprint.slice(0, 16)}...` : 'Unknown'}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-3">Bank Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-400">Bank Name:</span> {paymentAttempt.bank_name || 'Unknown'}</p>
                    <p><span className="text-gray-400">BIN (Bank ID):</span> {paymentAttempt.bank_bin || 'Unknown'}</p>
                    <p><span className="text-gray-400">Bank Country:</span> {paymentAttempt.bank_country || 'Unknown'}</p>
                    <p><span className="text-gray-400">Card Scheme:</span> {paymentAttempt.card_scheme || 'Unknown'}</p>
                    <p><span className="text-gray-400">Card Type:</span> {paymentAttempt.card_funding || 'Unknown'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-3">Financial Details</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-400">Attempted Amount:</span> ${parseFloat(paymentAttempt.amount || 0).toFixed(2)}</p>
                    <p><span className="text-gray-400">Currency:</span> {paymentAttempt.currency || 'USD'}</p>
                    <p><span className="text-gray-400">Status:</span> 
                      <span className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(paymentAttempt.status)}`}>
                        {getStatusIcon(paymentAttempt.status)}
                        {paymentAttempt.status}
                      </span>
                    </p>
                  </div>
                </div>
                {paymentAttempt.status === 'failed' && (
                  <div>
                    <h4 className="font-semibold text-white mb-3 text-red-400">Failure Information</h4>
                    <div className="space-y-2">
                      <p><span className="text-gray-400">Failure Reason:</span> 
                        <span className="text-red-400 ml-2">{paymentAttempt.failure_reason || 'Unknown'}</span>
                      </p>
                      <p><span className="text-gray-400">Failure Code:</span> {paymentAttempt.failure_code || 'Unknown'}</p>
                      <p><span className="text-gray-400">Decline Code:</span> {paymentAttempt.decline_code || 'Not specified'}</p>
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-white mb-3">Device & Location</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-400">IP Address:</span> {paymentAttempt.ip_address || 'Unknown'}</p>
                    <p><span className="text-gray-400">Location:</span> {formatLocation(paymentAttempt.location)}</p>
                    <p><span className="text-gray-400">Device Fingerprint:</span> 
                      <span className="text-xs text-gray-400 ml-2 font-mono">
                        {paymentAttempt.device_fingerprint ? `${paymentAttempt.device_fingerprint.slice(0, 20)}...` : 'Unknown'}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-3">User Agent</h4>
                  <div className="bg-black/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <p className="text-sm text-gray-300 font-mono break-all">
                      {paymentAttempt.user_agent || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Show Stripe payment details only if they exist */}
              {paymentAttempt.payment_details && (
                <div className="mt-8 pt-6 border-t border-white/20">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <CreditCard size={16} />
                    Stripe Payment Details (Available for successful payments)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-white mb-3">Stripe Transaction Details</h5>
                      <div className="space-y-2">
                        <p><span className="text-gray-400">Payment Intent ID:</span> {paymentAttempt.payment_details.stripe_payment_intent_id}</p>
                        <p><span className="text-gray-400">Payment Method ID:</span> {paymentAttempt.payment_details.stripe_payment_method_id}</p>
                        <p><span className="text-gray-400">Charge ID:</span> {paymentAttempt.payment_details.stripe_charge_id}</p>
                        <p><span className="text-gray-400">Customer ID:</span> {paymentAttempt.payment_details.stripe_customer_id}</p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-white mb-3">Financial Breakdown</h5>
                      <div className="space-y-2">
                        <p><span className="text-gray-400">Amount Charged:</span> ${parseFloat(paymentAttempt.payment_details.amount || 0).toFixed(2)}</p>
                        <p><span className="text-gray-400">Application Fee:</span> ${parseFloat(paymentAttempt.payment_details.application_fee_amount || 0).toFixed(2)}</p>
                        <p><span className="text-gray-400">Transfer Amount:</span> ${parseFloat(paymentAttempt.payment_details.transfer_amount || 0).toFixed(2)}</p>
                        <p><span className="text-gray-400">Outcome:</span> {paymentAttempt.payment_details.outcome}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show error if no payment details exist */}
              {!paymentAttempt.payment_details && paymentAttempt.status === 'failed' && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">
                    <strong>Note:</strong> Detailed Stripe payment information is only available for successful payment attempts. 
                    Since this payment failed, the above information shows what was captured during the attempt.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Fraud Tab */}
          {activeTab === 'fraud' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield size={18} />
                Fraud Detection Analysis
              </h3>
              
              {/* Show fraud_detection table data if available */}
              {paymentAttempt.fraud_detection ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Risk Assessment</h4>
                    <div className="space-y-2">
                      <p><span className="text-gray-400">Fraud Score:</span> {paymentAttempt.fraud_detection.fraud_score}</p>
                      <p><span className="text-gray-400">Risk Level:</span> 
                        <span className={`ml-2 font-semibold ${getRiskColor(paymentAttempt.fraud_detection.risk_level)}`}>
                          {paymentAttempt.fraud_detection.risk_level}
                        </span>
                      </p>
                      <p><span className="text-gray-400">Manual Review:</span> {paymentAttempt.fraud_detection.manual_review ? 'Yes' : 'No'}</p>
                      <p><span className="text-gray-400">Reviewed By:</span> {paymentAttempt.fraud_detection.reviewed_by || 'None'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-3">Detection Signals</h4>
                    <div className="space-y-2">
                      <p><span className="text-gray-400">Signals:</span></p>
                      <div className="ml-4">
                        {formatFraudSignals(paymentAttempt.fraud_detection.signals)}
                      </div>
                      <p><span className="text-gray-400">Rules Triggered:</span></p>
                      <div className="ml-4 text-sm text-gray-300">
                        {paymentAttempt.fraud_detection.rules_triggered ? 
                          JSON.parse(paymentAttempt.fraud_detection.rules_triggered).map((rule, idx) => (
                            <div key={idx}>• {rule.rule}: {rule.triggered ? 'Triggered' : 'Not triggered'}</div>
                          )) : 'None'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-white mb-3">Machine Learning Analysis</h4>
                    <div className="bg-black/30 rounded-lg p-4">
                      <pre className="text-sm text-gray-300">
                        {JSON.stringify(JSON.parse(paymentAttempt.fraud_detection.machine_learning_result || '{}'), null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                /* Show basic fraud info from payment_attempts table */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Basic Risk Assessment</h4>
                    <div className="space-y-2">
                      <p><span className="text-gray-400">Risk Level:</span> 
                        <span className={`ml-2 font-semibold ${getRiskColor(paymentAttempt.payment_details?.risk_level)}`}>
                          {paymentAttempt.payment_details?.risk_level || 'Not assessed'}
                        </span>
                      </p>
                      <p><span className="text-gray-400">Risk Score:</span> {paymentAttempt.payment_details?.risk_score || 'Not calculated'}</p>
                      <p><span className="text-gray-400">Payment Method:</span> {paymentAttempt.payment_method}</p>
                      <p><span className="text-gray-400">IP Address:</span> {paymentAttempt.ip_address}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-3">Location Analysis</h4>
                    <div className="space-y-2">
                      <p><span className="text-gray-400">Location:</span> {formatLocation(paymentAttempt.location)}</p>
                      <p><span className="text-gray-400">Device Fingerprint:</span> 
                        <span className="text-xs text-gray-400 ml-2 font-mono">
                          {paymentAttempt.device_fingerprint ? `${paymentAttempt.device_fingerprint.slice(0, 20)}...` : 'Unknown'}
                        </span>
                      </p>
                      <p><span className="text-gray-400">Card Country:</span> {paymentAttempt.card_country || 'Unknown'}</p>
                      <p><span className="text-gray-400">Card Brand:</span> {paymentAttempt.card_brand || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show note if no detailed fraud detection */}
              {!paymentAttempt.fraud_detection && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    <strong>Note:</strong> Detailed fraud detection analysis is only available for payments that completed the initial processing. 
                    The above information shows basic risk indicators that were captured during the payment attempt.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity size={18} />
                Status Change Timeline
              </h3>
              {paymentAttempt.payment_status_updates && paymentAttempt.payment_status_updates.length > 0 ? (
                <div className="space-y-4">
                  {paymentAttempt.payment_status_updates
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .map((update, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(update.new_status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">
                              {update.old_status || 'None'} → {update.new_status}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(update.created_at).toLocaleString()}
                            </span>
                          </div>
                          {update.reason && (
                            <p className="text-sm text-gray-300">Reason: {update.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-400">No status updates available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentDetail
