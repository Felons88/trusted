import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileText, Download, Edit, Mail, DollarSign, Calendar, User, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function InvoiceDetail() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

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
          clients:client_id(id, full_name, email, phone, address),
          invoice_items(*)
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

  const statusColors = {
    draft: 'bg-gray-500/20 text-gray-400',
    sent: 'bg-blue-500/20 text-blue-400',
    paid: 'bg-green-500/20 text-green-400',
    overdue: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-red-500/20 text-red-400'
  }

  const handleSendEmail = async () => {
    if (!invoice?.clients?.email) {
      alert('Client email address is required')
      return
    }

    try {
      // Call the send invoice email edge function
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice.id,
          clientEmail: invoice.clients.email,
          clientName: invoice.clients.full_name
        }
      })

      if (error) throw error

      // Update invoice status to 'sent'
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoice.id)

      if (updateError) throw updateError

      alert('Invoice sent successfully!')
      fetchInvoice() // Refresh invoice data
    } catch (error) {
      console.error('Error sending invoice:', error)
      alert('Failed to send invoice: ' + error.message)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      // Generate HTML content for the invoice
      const invoiceHTML = generateInvoiceHTML(invoice)
      
      // Create a blob with the HTML content
      const blob = new Blob([invoiceHTML], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      // Create a download link
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoice.invoice_number || invoice.id}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the URL
      URL.revokeObjectURL(url)
      
      alert('Invoice downloaded as HTML file! You can open it and print to PDF.')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('Failed to download invoice: ' + error.message)
    }
  }

  const generateInvoiceHTML = (invoice) => {
    const items = invoice.invoice_items || []
    const total = invoice.total || items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice #${invoice.invoice_number || invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #000; background: white; }
          .container { max-width: 800px; margin: 0 auto; padding: 30px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 28px; color: #1a1a1a; }
          .header p { margin: 5px 0; color: #666; }
          .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-section { flex: 1; }
          .info-section h3 { margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px; }
          .info-section p { margin: 5px 0; color: #333; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .table th, .table td { border: 1px solid #000; padding: 12px; text-align: left; }
          .table th { background: #f8f9fa; font-weight: bold; }
          .table .text-right { text-align: right; }
          .total { font-size: 18px; font-weight: bold; text-align: right; color: #1a1a1a; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #000; text-align: center; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Trusted Mobile Detailing</h1>
            <p>Professional Car Detailing Services</p>
          </div>
          
          <div class="info">
            <div class="info-section">
              <h3>Bill To:</h3>
              <p><strong>${invoice.clients?.full_name || 'Client'}</strong></p>
              <p>${invoice.clients?.email || ''}</p>
              ${invoice.clients?.address ? `<p>${invoice.clients.address}</p>` : ''}
            </div>
            <div class="info-section">
              <h3>Invoice Details:</h3>
              <p><strong>Invoice #:</strong> ${invoice.invoice_number || invoice.id}</p>
              <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString()}</p>
              ${invoice.due_date ? `<p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>` : ''}
              <p><strong>Status:</strong> ${invoice.status || 'draft'}</p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">$${item.unit_price.toFixed(2)}</td>
                  <td class="text-right">$${(item.quantity * item.unit_price).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="total">Total:</td>
                <td class="total">$${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          ${invoice.notes ? `
            <div style="margin-top: 30px;">
              <h3>Notes:</h3>
              <p>${invoice.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Thank you for your business! For questions, please contact us.</p>
            <p>Trusted Mobile Detailing - Professional Car Care Services</p>
          </div>
        </div>
      </body>
      </html>
    `
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
        <p className="text-light-gray mb-4">The invoice you're looking for doesn't exist.</p>
        <Link to="/admin/invoices" className="btn-primary">
          Back to Invoices
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/invoices"
            className="text-light-gray hover:text-electric-blue transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-light-gray">Invoice Details</h1>
            <p className="text-light-gray">View and manage invoice information</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleSendEmail}
            className="btn-secondary flex items-center space-x-2"
          >
            <Mail size={16} />
            <span>Send Email</span>
          </button>
          <Link
            to={`/admin/invoices/${id}/edit`}
            className="btn-secondary flex items-center space-x-2"
          >
            <Edit size={16} />
            <span>Edit</span>
          </Link>
          <button 
            onClick={handleDownloadPDF}
            className="btn-primary flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Download Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="glass-card">
        {/* Invoice Header */}
        <div className="border-b border-navy-light pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-light-gray mb-2">
                Invoice #{invoice.invoice_number || `INV-${invoice.id}`}
              </h2>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  statusColors[invoice.status] || statusColors.draft
                }`}>
                  {invoice.status || 'draft'}
                </span>
                <span className="text-light-gray text-sm">
                  Created: {new Date(invoice.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-green-400">
                ${invoice.total?.toFixed(2) || '0.00'}
              </div>
              {invoice.due_date && (
                <div className="text-sm text-light-gray">
                  Due: {new Date(invoice.due_date).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-light-gray mb-3 flex items-center">
              <User className="mr-2 text-electric-blue" size={20} />
              Bill To
            </h3>
            <div className="space-y-2">
              <p className="text-light-gray font-medium">
                {invoice.clients?.full_name || 'Unknown Client'}
              </p>
              {invoice.clients?.email && (
                <p className="text-light-gray text-sm">{invoice.clients.email}</p>
              )}
              {invoice.clients?.phone && (
                <p className="text-light-gray text-sm">{invoice.clients.phone}</p>
              )}
              {invoice.clients?.address && (
                <p className="text-light-gray text-sm">{invoice.clients.address}</p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-light-gray mb-3 flex items-center">
              <Calendar className="mr-2 text-electric-blue" size={20} />
              Invoice Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-light-gray">Invoice Date:</span>
                <span className="text-light-gray">
                  {new Date(invoice.created_at).toLocaleDateString()}
                </span>
              </div>
              {invoice.due_date && (
                <div className="flex justify-between">
                  <span className="text-light-gray">Due Date:</span>
                  <span className="text-light-gray">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-light-gray">Payment Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  statusColors[invoice.status] || statusColors.draft
                }`}>
                  {invoice.status || 'draft'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-light-gray mb-4">Invoice Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-light">
                  <th className="text-left py-2 px-4 text-light-gray">Description</th>
                  <th className="text-center py-2 px-4 text-light-gray">Quantity</th>
                  <th className="text-right py-2 px-4 text-light-gray">Unit Price</th>
                  <th className="text-right py-2 px-4 text-light-gray">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.invoice_items?.map((item, index) => (
                  <tr key={index} className="border-b border-navy-light">
                    <td className="py-3 px-4 text-light-gray">{item.description}</td>
                    <td className="py-3 px-4 text-center text-light-gray">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-light-gray">
                      ${item.unit_price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 px-4 text-right text-light-gray font-medium">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-navy-light">
                  <td colSpan="3" className="py-3 px-4 text-right font-semibold text-light-gray">
                    Total:
                  </td>
                  <td className="py-3 px-4 text-right text-xl font-bold text-green-400">
                    ${invoice.total?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t border-navy-light pt-6">
            <h3 className="text-lg font-semibold text-light-gray mb-3">Notes</h3>
            <p className="text-light-gray">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InvoiceDetail
