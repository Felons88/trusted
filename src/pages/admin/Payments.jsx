import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, CreditCard, Smartphone, CheckCircle, XCircle, Clock, Calendar, User, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients:client_id(id, full_name, email),
          invoices:invoice_id(id, invoice_number)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoices?.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'stripe':
      case 'card':
        return <CreditCard size={16} />
      case 'paypal':
        return <DollarSign size={16} />
      case 'cash':
        return <DollarSign size={16} />
      default:
        return <Smartphone size={16} />
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-400" />
      case 'failed':
        return <XCircle size={16} className="text-red-400" />
      case 'pending':
        return <Clock size={16} className="text-yellow-400" />
      default:
        return <Clock size={16} className="text-gray-400" />
    }
  }

  const statusColors = {
    completed: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    refunded: 'bg-blue-500/20 text-blue-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-gray">Payments</h1>
          <p className="text-light-gray">Track and manage all payment transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray" size={16} />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-navy-light border border-navy rounded-lg text-light-gray placeholder-light-gray focus:outline-none focus:border-electric-blue"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-navy-light border border-navy rounded-lg text-light-gray focus:outline-none focus:border-electric-blue"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Payments List */}
      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-light">
                <th className="text-left py-3 px-4 text-light-gray">Transaction ID</th>
                <th className="text-left py-3 px-4 text-light-gray">Client</th>
                <th className="text-left py-3 px-4 text-light-gray">Amount</th>
                <th className="text-left py-3 px-4 text-light-gray">Method</th>
                <th className="text-left py-3 px-4 text-light-gray">Status</th>
                <th className="text-left py-3 px-4 text-light-gray">Date</th>
                <th className="text-left py-3 px-4 text-light-gray">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-navy-light hover:bg-navy-light/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="text-electric-blue" size={16} />
                      <span className="text-light-gray font-mono text-sm">
                        {payment.transaction_id || `PAY-${payment.id}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <User className="text-light-gray" size={16} />
                      <span className="text-light-gray">
                        {payment.clients?.full_name || 'Unknown Client'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-green-400 font-medium">
                      ${payment.amount?.toFixed(2) || '0.00'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {getPaymentIcon(payment.payment_method)}
                      <span className="text-light-gray capitalize">
                        {payment.payment_method || 'unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(payment.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        statusColors[payment.status] || 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {payment.status || 'unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="text-light-gray" size={16} />
                      <span className="text-light-gray text-sm">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {payment.invoices ? (
                      <Link
                        to={`/admin/invoices/${payment.invoice_id}`}
                        className="text-electric-blue hover:text-bright-cyan text-sm"
                      >
                        {payment.invoices.invoice_number || `INV-${payment.invoice_id}`}
                      </Link>
                    ) : (
                      <span className="text-light-gray text-sm">No invoice</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="text-electric-blue mx-auto mb-4" size={48} />
              <h3 className="text-lg font-bold text-light-gray mb-2">No Payments Found</h3>
              <p className="text-light-gray mb-4">
                {searchTerm || statusFilter !== 'all' ? 
                  'Try adjusting your filters' : 
                  'No payment transactions have been recorded yet'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Payments
