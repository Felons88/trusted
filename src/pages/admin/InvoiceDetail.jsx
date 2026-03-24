import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileText, Download, Edit, Mail, DollarSign, Calendar, User, CheckCircle, Clock, CreditCard, MapPin, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

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
      toast.error('Client email address is required')
      return
    }

    try {
      // Call the send invoice email edge function with proper authorization
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
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

      toast.success('Invoice sent successfully!')
      fetchInvoice() // Refresh invoice data
    } catch (error) {
      console.error('Error sending invoice:', error)
      toast.error('Failed to send invoice: ' + error.message)
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
      
      toast.success('Invoice downloaded as HTML file! You can open it and print to PDF.')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Failed to download invoice: ' + error.message)
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

        {/* Stripe Payment Information - Only show if paid */}
        {invoice.status === 'paid' && (invoice.stripe_payment_intent_id || invoice.stripe_charge_id) && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-light-gray mb-3 flex items-center">
              <CreditCard className="mr-2 text-electric-blue" size={20} />
              Payment Information
            </h3>
            <div className="bg-navy-dark/30 border border-electric-blue/20 rounded-lg p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {invoice.stripe_payment_intent_id && (
                    <div>
                      <p className="text-xs text-light-gray mb-1">Payment Intent ID</p>
                      <p className="text-sm font-mono text-electric-blue break-all">
                        {invoice.stripe_payment_intent_id}
                      </p>
                      <a
                        href={`https://dashboard.stripe.com/payments/${invoice.stripe_payment_intent_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 mt-1"
                      >
                        <ExternalLink size={12} className="mr-1" />
                        View in Stripe Dashboard
                      </a>
                    </div>
                  )}
                  
                  {invoice.paid_at && (
                    <div>
                      <p className="text-xs text-light-gray mb-1">Payment Date</p>
                      <p className="text-sm text-light-gray">
                        {new Date(invoice.paid_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {invoice.total_charged && (
                    <div>
                      <p className="text-xs text-light-gray mb-1">Total Charged</p>
                      <p className="text-sm text-green-400 font-semibold">
                        ${parseFloat(invoice.total_charged).toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {invoice.stripe_fees && (
                    <div>
                      <p className="text-xs text-light-gray mb-1">Stripe Fees</p>
                      <p className="text-sm text-light-gray">
                        ${parseFloat(invoice.stripe_fees).toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {invoice.base_amount && (
                    <div>
                      <p className="text-xs text-light-gray mb-1">Base Amount</p>
                      <p className="text-sm text-light-gray">
                        ${parseFloat(invoice.base_amount).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Payment Method Details */}
              {invoice.payment_method_details && (
                <div className="mt-4 pt-4 border-t border-navy-light">
                  <p className="text-xs text-light-gray mb-2">Payment Method</p>
                  <div className="text-sm text-light-gray">
                    {typeof invoice.payment_method_details === 'string' 
                      ? invoice.payment_method_details 
                      : JSON.stringify(invoice.payment_method_details, null, 2)
                    }
                  </div>
                </div>
              )}
              
              {/* Billing Address */}
              {invoice.billing_address && (
                <div className="mt-4 pt-4 border-t border-navy-light">
                  <p className="text-xs text-light-gray mb-2 flex items-center">
                    <MapPin size={12} className="mr-1" />
                    Billing Address
                  </p>
                  <div className="text-sm text-light-gray">
                    {typeof invoice.billing_address === 'string' 
                      ? invoice.billing_address 
                      : JSON.stringify(invoice.billing_address, null, 2)
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
