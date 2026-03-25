import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Search, 
  RefreshCw, 
  Eye,
  AlertTriangle,
  MapPin,
  Shield,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

function Payments() {
  const [paymentAttempts, setPaymentAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedRows, setExpandedRows] = useState(new Set())

  useEffect(() => {
    fetchPaymentAttempts()
  }, [])

  const fetchPaymentAttempts = async () => {
    try {
      console.log('Fetching payment attempts with full tracking data...')
      
      const { data, error } = await supabase
        .from('payment_attempts')
        .select(`
          *,
          invoices:invoice_id (
            invoice_number,
            total,
            status,
            created_at
          ),
          clients:client_id (
            full_name,
            email
          ),
          payment_details (
            stripe_payment_intent_id,
            stripe_payment_method_id,
            stripe_charge_id,
            stripe_customer_id,
            amount,
            currency,
            outcome,
            network_status,
            reason,
            risk_level,
            risk_score,
            fraud_signals,
            application_fee_amount,
            transfer_amount,
            created_at
          ),
          fraud_detection (
            fraud_score,
            risk_level,
            signals,
            rules_triggered,
            machine_learning_result,
            manual_review,
            created_at
          ),
          payment_status_updates (
            old_status,
            new_status,
            reason,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching payment attempts:', error)
        throw error
      }
      
      console.log('Payment attempts data:', data)
      setPaymentAttempts(data || [])
    } catch (error) {
      console.error('Error fetching payment attempts:', error)
      toast.error('Failed to load payment attempts')
    } finally {
      setLoading(false)
    }
  }

  const toggleRowExpansion = (id) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const filteredPaymentAttempts = paymentAttempts.filter(attempt => {
    const matchesSearch = 
      attempt.invoices?.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.clients?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.stripe_payment_intent_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || attempt.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle size={16} className="text-green-400" />
      case 'pending':
        return <Clock size={16} className="text-yellow-400" />
      case 'failed':
        return <XCircle size={16} className="text-red-400" />
      case 'processing':
        return <RefreshCw size={16} className="text-blue-400" />
      default:
        return <Clock size={16} className="text-gray-400" />
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
      return parsed.map(s => s.description || s.type).join(', ') || 'None'
    } catch {
      return 'None'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Payment Transactions</h1>
          <p className="text-gray-400">Complete payment tracking with fraud detection and geolocation</p>
        </div>
        <button
          onClick={fetchPaymentAttempts}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Attempts</p>
              <p className="text-2xl font-bold text-white">{paymentAttempts.length}</p>
            </div>
            <Activity className="text-blue-400" size={24} />
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Successful</p>
              <p className="text-2xl font-bold text-green-400">
                {paymentAttempts.filter(a => a.status === 'succeeded').length}
              </p>
            </div>
            <CheckCircle className="text-green-400" size={24} />
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Failed</p>
              <p className="text-2xl font-bold text-red-400">
                {paymentAttempts.filter(a => a.status === 'failed').length}
              </p>
            </div>
            <XCircle className="text-red-400" size={24} />
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">High Risk</p>
              <p className="text-2xl font-bold text-yellow-400">
                {paymentAttempts.filter(a => a.fraud_detection?.risk_level === 'high').length}
              </p>
            </div>
            <AlertTriangle className="text-yellow-400" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by invoice, client, or payment ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
          >
            <option value="all">All Status</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
          </select>
        </div>
      </div>

      {/* Payment Attempts Table */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Invoice</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Client</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Amount</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Risk</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Location</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Date</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPaymentAttempts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-400">
                    {loading ? 'Loading payment attempts...' : 'No payment attempts found'}
                  </td>
                </tr>
              ) : (
                filteredPaymentAttempts.map((attempt) => (
                  <React.Fragment key={attempt.id}>
                    <tr className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">{attempt.invoices?.invoice_number}</p>
                          <p className="text-xs text-gray-400 font-mono">{attempt.stripe_payment_intent_id?.slice(-8)}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white">{attempt.clients?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{attempt.clients?.email || 'No email'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-green-400 font-bold">
                          ${parseFloat(attempt.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(attempt.status)}`}>
                          {getStatusIcon(attempt.status)}
                          {attempt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Shield size={14} className={getRiskColor(attempt.fraud_detection?.risk_level)} />
                          <span className={`text-sm ${getRiskColor(attempt.fraud_detection?.risk_level)}`}>
                            {attempt.fraud_detection?.risk_level || 'Unknown'}
                          </span>
                          {attempt.fraud_detection?.fraud_score && (
                            <span className="text-xs text-gray-400">
                              ({attempt.fraud_detection.fraud_score})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-300">
                            {formatLocation(attempt.location)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-300">
                          {new Date(attempt.created_at).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-gray-400">
                            {new Date(attempt.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleRowExpansion(attempt.id)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="View Details"
                          >
                            {expandedRows.has(attempt.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <Link
                            to={`/admin/payments/${attempt.id}`}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="View Full Payment Details"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            to={`/admin/invoices/${attempt.invoice_id}`}
                            className="text-gray-400 hover:text-gray-300 transition-colors"
                            title="View Invoice"
                          >
                            <DollarSign size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {expandedRows.has(attempt.id) && (
                      <tr className="bg-navy-900/50">
                        <td colSpan="8" className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            {/* Payment Details */}
                            <div>
                              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                                <CreditCard size={14} />
                                Payment Details
                              </h4>
                              <div className="space-y-1 text-gray-300">
                                <p><span className="text-gray-400">Method:</span> {attempt.payment_method}</p>
                                <p><span className="text-gray-400">Card:</span> {attempt.card_brand} ****{attempt.card_last4}</p>
                                <p><span className="text-gray-400">IP Address:</span> {attempt.ip_address}</p>
                                <p><span className="text-gray-400">User Agent:</span> {attempt.user_agent?.slice(0, 50)}...</p>
                              </div>
                            </div>
                            
                            {/* Fraud Detection */}
                            <div>
                              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                                <Shield size={14} />
                                Fraud Detection
                              </h4>
                              <div className="space-y-1 text-gray-300">
                                <p><span className="text-gray-400">Risk Score:</span> {attempt.fraud_detection?.fraud_score || 0}</p>
                                <p><span className="text-gray-400">Risk Level:</span> {attempt.fraud_detection?.risk_level}</p>
                                <p><span className="text-gray-400">Signals:</span> {formatFraudSignals(attempt.fraud_detection?.signals)}</p>
                                <p><span className="text-gray-400">Manual Review:</span> {attempt.fraud_detection?.manual_review ? 'Yes' : 'No'}</p>
                              </div>
                            </div>
                            
                            {/* Status History */}
                            <div>
                              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                                <Activity size={14} />
                                Status History
                              </h4>
                              <div className="space-y-1 text-gray-300 max-h-24 overflow-y-auto">
                                {attempt.payment_status_updates?.map((update, idx) => (
                                  <p key={idx}>
                                    <span className="text-gray-400">
                                      {new Date(update.created_at).toLocaleTimeString()}
                                    </span>: {update.old_status} → {update.new_status}
                                    {update.reason && <span className="text-xs text-red-400"> ({update.reason})</span>}
                                  </p>
                                )) || <p className="text-gray-400">No status updates</p>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Payments
