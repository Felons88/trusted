import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, CreditCard, CheckCircle, XCircle, Clock, Calendar, User, Search, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

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
      // Get paid invoices as payments
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id(id, full_name, email)
        `)
        .eq('status', 'paid')
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
      payment.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.clients?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
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
        return <CreditCard size={16} />
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <CheckCircle size={16} className="text-green-400" />
      case 'pending':
        return <Clock size={16} className="text-yellow-400" />
      case 'failed':
        return <XCircle size={16} className="text-red-400" />
      default:
        return <Clock size={16} className="text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
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
                className="w-full pl-10 pr-4 py-2 bg-navy-dark/50 border border-electric-blue/20 rounded-lg text-white placeholder-light-gray focus:outline-none focus:border-electric-blue"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-navy-dark/50 border border-electric-blue/20 rounded-lg text-white focus:outline-none focus:border-electric-blue"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-electric-blue/20">
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Invoice #</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Client</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Amount</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Date</th>
                <th className="text-left py-3 px-4 text-light-gray font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-light-gray">
                    {loading ? 'Loading payments...' : 'No payments found'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-electric-blue/10 hover:bg-navy-dark/30">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-electric-blue">
                        {payment.invoice_number}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-medium">
                          {payment.clients?.full_name || 'Unknown Client'}
                        </p>
                        <p className="text-xs text-light-gray">
                          {payment.clients?.email || 'No email'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-green-400 font-bold">
                        ${parseFloat(payment.total_amount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-light-gray">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link
                          to={`/admin/invoices/${payment.id}`}
                          className="text-electric-blue hover:text-bright-cyan transition-colors"
                          title="View Invoice"
                        >
                          <DollarSign size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
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
