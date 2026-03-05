import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Plus, Download, Eye, Edit, Trash2, Calendar, DollarSign, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id(id, full_name, email)
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

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.status?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statusColors = {
    draft: 'bg-gray-500/20 text-gray-400',
    sent: 'bg-blue-500/20 text-blue-400',
    paid: 'bg-green-500/20 text-green-400',
    overdue: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-red-500/20 text-red-400'
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
          <h1 className="text-3xl font-bold text-light-gray">Invoices</h1>
          <p className="text-light-gray">Manage client invoices and payments</p>
        </div>
        <Link
          to="/admin/invoices/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>New Invoice</span>
        </Link>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-navy-light border border-navy rounded-lg text-light-gray placeholder-light-gray focus:outline-none focus:border-electric-blue"
        />
      </div>

      {/* Invoices List */}
      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-light">
                <th className="text-left py-3 px-4 text-light-gray">Invoice #</th>
                <th className="text-left py-3 px-4 text-light-gray">Client</th>
                <th className="text-left py-3 px-4 text-light-gray">Amount</th>
                <th className="text-left py-3 px-4 text-light-gray">Status</th>
                <th className="text-left py-3 px-4 text-light-gray">Due Date</th>
                <th className="text-left py-3 px-4 text-light-gray">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-navy-light hover:bg-navy-light/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="text-electric-blue" size={16} />
                      <span className="text-light-gray font-medium">
                        {invoice.invoice_number || `INV-${invoice.id}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <User className="text-light-gray" size={16} />
                      <span className="text-light-gray">
                        {invoice.clients?.full_name || 'Unknown Client'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="text-green-400" size={16} />
                      <span className="text-light-gray font-medium">
                        ${invoice.total?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      statusColors[invoice.status] || statusColors.draft
                    }`}>
                      {invoice.status || 'draft'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="text-light-gray" size={16} />
                      <span className="text-light-gray text-sm">
                        {invoice.due_date ? 
                          new Date(invoice.due_date).toLocaleDateString() : 
                          'No due date'
                        }
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/admin/invoices/${invoice.id}`}
                        className="text-electric-blue hover:text-bright-cyan"
                        title="View Invoice"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        to={`/admin/invoices/${invoice.id}/edit`}
                        className="text-blue-400 hover:text-blue-300"
                        title="Edit Invoice"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        className="text-green-400 hover:text-green-300"
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8">
              <FileText className="text-electric-blue mx-auto mb-4" size={48} />
              <h3 className="text-lg font-bold text-light-gray mb-2">No Invoices Found</h3>
              <p className="text-light-gray mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first invoice to get started'}
              </p>
              {!searchTerm && (
                <Link
                  to="/admin/invoices/new"
                  className="btn-primary"
                >
                  Create First Invoice
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Invoices
