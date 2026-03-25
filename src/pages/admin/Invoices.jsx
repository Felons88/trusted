import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FileText, Plus, Download, Eye, Edit, Calendar, DollarSign, User, Search, Filter, MoreVertical, Mail, Phone, CheckCircle, AlertCircle, Clock, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [statusDropdowns, setStatusDropdowns] = useState({})

  const downloadInvoicePDF = async (invoice) => {
    try {
      // Create a simple HTML invoice for download
      const invoiceContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 30px; }
            .client-details { margin-bottom: 30px; }
            .items { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { text-align: right; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Invoice</h1>
            <h2>${invoice.invoice_number}</h2>
            <p>Issue Date: ${invoice.issue_date}</p>
            <p>Due Date: ${invoice.due_date}</p>
          </div>
          
          <div class="client-details">
            <h3>Bill To:</h3>
            <p>${invoice.clients?.full_name || 'N/A'}</p>
            <p>${invoice.clients?.email || 'N/A'}</p>
            <p>${invoice.clients?.phone || 'N/A'}</p>
          </div>
          
          <div class="items">
            <h3>Items:</h3>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Services</td>
                  <td>1</td>
                  <td>$${invoice.subtotal?.toFixed(2) || '0.00'}</td>
                  <td>$${invoice.subtotal?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr>
                  <td>Tax (6.875%)</td>
                  <td>1</td>
                  <td>$${invoice.tax?.toFixed(2) || '0.00'}</td>
                  <td>$${invoice.tax?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr>
                  <td>Platform Fee (4%)</td>
                  <td>1</td>
                  <td>$${invoice.platform_fee?.toFixed(2) || '0.00'}</td>
                  <td>$${invoice.platform_fee?.toFixed(2) || '0.00'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="total">
            <h3>Total: $${invoice.total?.toFixed(2) || '0.00'}</h3>
          </div>
          
          <div class="notes">
            <h3>Notes:</h3>
            <p>${invoice.notes || 'Thank you for your business!'}</p>
          </div>
        </body>
        </html>
      `

      // Create a blob and download
      const blob = new Blob([invoiceContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoice.invoice_number}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Invoice downloaded successfully!')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Error downloading invoice')
    }
  }

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId)

      if (error) throw error

      // Update local state
      setInvoices(invoices.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: newStatus }
          : invoice
      ))

      // Close dropdown
      setStatusDropdowns(prev => ({ ...prev, [invoiceId]: false }))

      toast.success(`Invoice status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating invoice status:', error)
      toast.error('Error updating invoice status')
    }
  }

  const toggleStatusDropdown = (invoiceId) => {
    setStatusDropdowns(prev => ({ 
      ...prev, 
      [invoiceId]: !prev[invoiceId] 
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle size={16} />
      case 'sent': return <Mail size={16} />
      case 'overdue': return <AlertCircle size={16} />
      case 'cancelled': return <Clock size={16} />
      default: return <Clock size={16} />
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id(id, full_name, email, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clients?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusConfig = (status) => {
    const configs = {
      draft: {
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: Clock,
        label: 'Draft'
      },
      sent: {
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: Mail,
        label: 'Sent'
      },
      paid: {
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: CheckCircle,
        label: 'Paid'
      },
      overdue: {
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: AlertCircle,
        label: 'Overdue'
      },
      cancelled: {
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: AlertCircle,
        label: 'Cancelled'
      }
    }
    return configs[status] || configs.draft
  }

  const isOverdue = (dueDate, status) => {
    if (status === 'paid' || status === 'cancelled') return false
    return new Date(dueDate) < new Date()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Invoices</h1>
              <p className="text-gray-400 text-lg">Manage client invoices and track payments</p>
            </div>
            <Link
              to="/admin/invoices/new"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center space-x-2 shadow-lg"
            >
              <Plus size={20} />
              <span>New Invoice</span>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Invoices', value: invoices.length, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
              { 
                label: 'Outstanding', 
                value: formatCurrency(
                  invoices
                    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
                    .reduce((sum, inv) => sum + (inv.total || 0), 0)
                ), 
                color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
              },
              { 
                label: 'Paid', 
                value: formatCurrency(
                  invoices
                    .filter(inv => inv.status === 'paid')
                    .reduce((sum, inv) => sum + (inv.total || 0), 0)
                ), 
                color: 'bg-green-500/20 text-green-400 border-green-500/30' 
              },
              { 
                label: 'Overdue', 
                value: invoices.filter(inv => isOverdue(inv.due_date, inv.status)).length,
                color: 'bg-red-500/20 text-red-400 border-red-500/30' 
              }
            ].map((stat, index) => (
              <div key={index} className={`backdrop-blur-xl rounded-xl p-4 border ${stat.color}`}>
                <p className="text-sm opacity-80 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search invoices by number, client name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices Grid */}
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 max-w-md mx-auto">
              <FileText className="text-blue-400 mx-auto mb-6" size={64} />
              <h3 className="text-2xl font-bold text-white mb-3">
                {searchTerm || statusFilter !== 'all' ? 'No Invoices Found' : 'No Invoices Yet'}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Create your first invoice to get started with billing'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <Link
                  to="/admin/invoices/new"
                  className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  <Plus size={20} />
                  <span>Create First Invoice</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredInvoices.map((invoice) => {
              const statusConfig = getStatusConfig(invoice.status)
              const StatusIcon = statusConfig.icon
              const overdue = isOverdue(invoice.due_date, invoice.status)
              
              return (
                <div key={invoice.id} className="group hover:transform hover:scale-[1.02] transition-all duration-300">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-white/20">
                    {/* Header */}
                    <div className="p-6 border-b border-white/10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <FileText className="text-blue-400" size={20} />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">
                              {invoice.invoice_number || `INV-${String(invoice.id).padStart(4, '0')}`}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              Created {formatDate(invoice.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <button
                              onClick={() => toggleStatusDropdown(invoice.id)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 hover:opacity-80 transition-opacity ${getStatusColor(invoice.status)}`}
                            >
                              {getStatusIcon(invoice.status)}
                              <span>{invoice.status}</span>
                              <ChevronDown size={12} />
                            </button>
                            
                            {statusDropdowns[invoice.id] && (
                              <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-white/20 rounded-lg shadow-xl z-50">
                                <div className="py-1">
                                  {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map(status => (
                                    <button
                                      key={status}
                                      onClick={() => updateInvoiceStatus(invoice.id, status)}
                                      className={`w-full px-3 py-2 text-left text-xs flex items-center space-x-2 hover:bg-white/10 transition-colors ${
                                        invoice.status === status ? 'bg-white/10' : ''
                                      }`}
                                    >
                                      {getStatusIcon(status)}
                                      <span className="capitalize">{status}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {overdue && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Client Info */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="text-gray-400" size={16} />
                          <span className="text-white font-medium">
                            {invoice.clients?.full_name || 'Unknown Client'}
                          </span>
                        </div>
                        {invoice.clients?.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="text-gray-400" size={16} />
                            <span className="text-gray-300 text-sm">{invoice.clients.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4">
                      {/* Amount */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Total Amount</span>
                        <span className="text-2xl font-bold text-white">
                          {formatCurrency(invoice.total)}
                        </span>
                      </div>

                      {/* Due Date */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="text-gray-400" size={16} />
                          <span className="text-gray-400">Due Date</span>
                        </div>
                        <span className={`text-sm font-medium ${overdue ? 'text-red-400' : 'text-gray-300'}`}>
                          {formatDate(invoice.due_date)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 pt-4 border-t border-white/10">
                        <Link
                          to={`/admin/invoices/${invoice.id}`}
                          className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </Link>
                        <Link
                          to={`/admin/invoices/${invoice.id}/edit`}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                          <Edit size={16} />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => downloadInvoicePDF(invoice)}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 px-4 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Invoices
