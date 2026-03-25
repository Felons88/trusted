import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FileText, Download, Mail, Calendar, DollarSign, ArrowLeft, CheckCircle, Clock, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import emailService from '../../services/emailService'
import toast from '../../utils/toast'

function ClientInvoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)
  const [emailing, setEmailing] = useState(null)
  const { user } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    setLoading(true)
    fetchInvoices()
  }, [location.pathname])

  const fetchInvoices = async () => {
    try {
      console.log('ClientInvoices: Fetching invoices for user:', user?.id)
      
      // Get client ID first
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
      
      console.log('ClientInvoices: Client data found:', clientData)
      
      if (!clientData || clientData.length === 0) {
        console.log('ClientInvoices: No client found for user')
        setLoading(false)
        return
      }

      const clientId = clientData[0].id
      console.log('ClientInvoices: Using client_id:', clientId)

      // Fetch invoices for the correct client
      const { data: invoicesData, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      console.log('ClientInvoices: Invoices data:', invoicesData)

      if (error) throw error
      setInvoices(invoicesData || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (invoiceId) => {
    setDownloading(invoiceId)
    try {
      console.log('Downloading invoice:', invoiceId)
      
      // Fetch invoice data directly from Supabase
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id(full_name, email, address, user_id)
        `)
        .eq('id', invoiceId)
        .single()

      if (invoiceError) {
        console.error('Invoice error:', invoiceError)
        throw new Error(`Invoice not found: ${invoiceError.message}`)
      }

      console.log('Invoice found:', invoice.invoice_number)

      // Generate HTML content client-side
      const htmlContent = generateInvoiceHTML(invoice)
      console.log('HTML content generated')
      
      // Create a new window and print the HTML
      const printWindow = window.open('', '_blank')
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Wait for the print dialog to close
      printWindow.onafterprint = () => {
        printWindow.close()
        console.log('PDF download completed via print')
      }
      
      // Fallback: try to download as file
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close()
          // Create blob from HTML
          const blob = new Blob([htmlContent], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `invoice-${invoiceId}.html`
          document.body.appendChild(a)
          a.click()
          setTimeout(() => {
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }, 100)
        }
      }, 1000)
      
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error(`Error generating invoice: ${error.message}`)
    } finally {
      setDownloading(null)
    }
  }

  const handleEmail = async (invoiceId) => {
    setEmailing(invoiceId)
    try {
      console.log('Emailing invoice:', invoiceId)
      
      // Fetch invoice data directly from Supabase
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id(full_name, email, address, user_id)
        `)
        .eq('id', invoiceId)
        .single()

      if (invoiceError) {
        console.error('Invoice error:', invoiceError)
        throw new Error(`Invoice not found: ${invoiceError.message}`)
      }

      console.log('Invoice found:', invoice.invoice_number)

      // Generate HTML email content
      const emailContent = generateEmailHTML(invoice)
      
      // Send email using existing EmailService
      await emailService.sendDirectEmail({
        to: invoice.clients?.email,
        subject: `Invoice #${invoice.invoice_number || invoice.id} - Trusted Mobile Detailing`,
        html: emailContent
      })

      console.log('Email sent successfully')
      toast.success('Invoice sent successfully to your email!')
      
    } catch (error) {
      console.error('Error emailing invoice:', error)
      toast.error(`Error sending email: ${error.message}`)
    } finally {
      setEmailing(null)
    }
  }

  const generateEmailHTML = (invoice) => {
    const paidDate = invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : ''
    const createdDate = new Date(invoice.created_at).toLocaleDateString()

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${invoice.invoice_number || invoice.id} - Trusted Mobile Detailing</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 32px; font-weight: bold; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
          .content { padding: 30px; }
          .invoice-number { background: #e3f2fd; color: #1976d2; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 30px; font-size: 18px; font-weight: bold; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .info-section { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
          .info-section h3 { margin: 0 0 15px 0; color: #333; font-size: 18px; }
          .info-section p { margin: 8px 0; color: #666; font-size: 14px; }
          .status { text-align: center; padding: 15px; border-radius: 8px; font-weight: bold; margin: 20px 0; font-size: 16px; }
          .status.paid { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
          .breakdown { width: 100%; border-collapse: collapse; margin: 30px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .breakdown th { background: #007bff; color: white; padding: 15px; text-align: left; font-weight: bold; font-size: 14px; }
          .breakdown td { padding: 15px; border-bottom: 1px solid #eee; font-size: 14px; }
          .breakdown .text-right { text-align: right; font-weight: bold; }
          .total { background: #f8f9fa; font-size: 16px; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee; }
          .footer p { margin: 8px 0; color: #666; font-size: 14px; }
          .footer .company { font-weight: bold; color: #333; font-size: 16px; }
          .notes { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .notes h4 { margin: 0 0 10px 0; color: #856404; font-size: 16px; }
          .notes p { margin: 0; color: #856404; font-size: 14px; }
          @media only screen and (max-width: 600px) {
            .info-grid { grid-template-columns: 1fr; gap: 20px; }
            .header { padding: 20px; }
            .header h1 { font-size: 24px; }
            .content { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Trusted Mobile Detailing</h1>
            <p>Professional Car Detailing Services</p>
          </div>
          
          <div class="content">
            <div class="invoice-number">
              Invoice #${invoice.invoice_number || invoice.id}
            </div>
            
            <div class="info-grid">
              <div class="info-section">
                <h3>📍 Bill To:</h3>
                <p><strong>${invoice.clients?.full_name || 'Client'}</strong></p>
                <p>${invoice.clients?.email || ''}</p>
                ${invoice.clients?.address ? `<p>${invoice.clients.address}</p>` : ''}
              </div>
              <div class="info-section">
                <h3>📅 Invoice Details:</h3>
                <p><strong>Invoice Date:</strong> ${createdDate}</p>
                ${paidDate ? `<p><strong>Paid Date:</strong> ${paidDate}</p>` : ''}
                <p><strong>Status:</strong> ${invoice.status?.toUpperCase() || 'DRAFT'}</p>
              </div>
            </div>

            ${invoice.status === 'paid' ? '<div class="status paid">✅ PAID</div>' : ''}

            <h3 style="color: #333; margin-bottom: 20px;">💳 Payment Breakdown:</h3>
            <table class="breakdown">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Service Amount</td>
                  <td class="text-right">$${invoice.base_amount || invoice.total || '0.00'}</td>
                </tr>
                ${invoice.platform_fees ? `
                <tr>
                  <td>Platform Fees (4%)</td>
                  <td class="text-right">$${invoice.platform_fees}</td>
                </tr>
                ` : ''}
                ${invoice.stripe_fees ? `
                <tr>
                  <td>Stripe Processing Fees</td>
                  <td class="text-right">$${invoice.stripe_fees}</td>
                </tr>
                ` : ''}
                ${invoice.total_fees ? `
                <tr>
                  <td>Total Fees</td>
                  <td class="text-right">$${invoice.total_fees}</td>
                </tr>
                ` : ''}
              </tbody>
              <tfoot>
                <tr class="total">
                  <td><strong>Total Charged:</strong></td>
                  <td class="text-right"><strong>$${invoice.total_charged || invoice.total || '0.00'}</strong></td>
                </tr>
              </tfoot>
            </table>

            ${invoice.notes ? `
              <div class="notes">
                <h4>📝 Notes:</h4>
                <p>${invoice.notes}</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #666; font-style: italic;">Thank you for choosing Trusted Mobile Detailing!</p>
            </div>
          </div>

          <div class="footer">
            <p class="company">Trusted Mobile Detailing</p>
            <p>Professional Car Care Services</p>
            <p>For questions, please contact us</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  const getStatusColors = (status) => {
    const colors = {
      draft: 'bg-gray-500/20 text-gray-400',
      sent: 'bg-blue-500/20 text-blue-400',
      paid: 'bg-green-500/20 text-green-400',
      overdue: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-red-500/20 text-red-400'
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const paidInvoices = invoices.filter(inv => inv.status === 'paid')
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.total_charged || inv.total || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/client-portal" 
            className="inline-flex items-center gap-2 text-light-gray hover:text-metallic-silver mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold metallic-heading mb-2">Payment Receipts</h1>
              <p className="text-light-gray/80">
                View, download, and email your payment receipts
              </p>
            </div>
            
            {paidInvoices.length > 0 && (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-xl p-4 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                    <DollarSign className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-light-gray/60">Total Paid</p>
                    <p className="text-2xl font-bold text-green-400">${totalPaid.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoices List */}
        {invoices.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-electric-blue/20 blur-2xl rounded-full"></div>
              <div className="relative bg-navy-dark/50 border border-electric-blue/20 p-6 rounded-2xl">
                <FileText className="text-light-gray mx-auto" size={48} />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-metallic-silver mb-3">No Invoices Yet</h3>
            <p className="text-light-gray/60 mb-6 max-w-sm mx-auto">
              Your payment history will appear here once you have invoices
            </p>
            <Link 
              to="/client-portal/bookings/new" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-electric-blue to-bright-cyan hover:from-electric-blue/90 hover:to-bright-cyan/90 rounded-lg text-white font-semibold shadow-lg transition-all"
            >
              Book a Service
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="bg-gradient-to-br from-navy-dark/30 to-navy-dark/50 backdrop-blur-xl rounded-2xl p-6 border border-electric-blue/20 hover:border-electric-blue/40 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                  {/* Invoice Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-metallic-silver mb-1">
                          {invoice.invoice_number}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-light-gray/60">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(invoice.created_at)}
                          </div>
                          {invoice.paid_at && (
                            <div className="flex items-center gap-1 text-green-400">
                              <CheckCircle size={14} />
                              Paid {formatDate(invoice.paid_at)}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColors(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-light-gray/60 mb-1">Service Amount</p>
                        <p className="font-semibold text-metallic-silver">${invoice.base_amount || invoice.total || '0.00'}</p>
                      </div>
                      {invoice.status === 'paid' ? (
                        <>
                          <div>
                            <p className="text-xs text-light-gray/60 mb-1">Platform Fees (4%)</p>
                            <p className="font-semibold text-metallic-silver">${invoice.platform_fees || '0.00'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-light-gray/60 mb-1">Stripe Fees</p>
                            <p className="font-semibold text-metallic-silver">${invoice.stripe_fees || '0.00'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-light-gray/60 mb-1">Total Charged</p>
                            <p className="font-bold text-lg text-bright-cyan">
                              ${invoice.total_charged || invoice.total || '0.00'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2">
                          <p className="text-xs text-light-gray/60 mb-1">Total Amount</p>
                          <p className="font-bold text-lg text-bright-cyan">
                            ${invoice.total || '0.00'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 lg:flex-col">
                    {invoice.status === 'paid' && (
                      <>
                        <button
                          onClick={() => handleDownload(invoice.id)}
                          disabled={downloading === invoice.id}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-electric-blue/10 hover:bg-electric-blue/20 border border-electric-blue/30 rounded-lg text-light-gray hover:text-metallic-silver transition-all disabled:opacity-50"
                        >
                          <Download size={16} />
                          {downloading === invoice.id ? 'Downloading...' : 'Download'}
                        </button>
                        <button
                          onClick={() => handleEmail(invoice.id)}
                          disabled={emailing === invoice.id}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-bright-cyan/10 hover:bg-bright-cyan/20 border border-bright-cyan/30 rounded-lg text-light-gray hover:text-metallic-silver transition-all disabled:opacity-50"
                        >
                          <Mail size={16} />
                          {emailing === invoice.id ? 'Sending...' : 'Email'}
                        </button>
                      </>
                    )}
                    {invoice.status === 'sent' && (
                      <>
                        <Link
                          to={`/invoice-payment/${invoice.id}`}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          <CreditCard size={16} />
                          Pay Now
                        </Link>
                        <button
                          onClick={() => handleDownload(invoice.id)}
                          disabled={downloading === invoice.id}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-electric-blue/10 hover:bg-electric-blue/20 border border-electric-blue/30 rounded-lg text-light-gray hover:text-metallic-silver transition-all disabled:opacity-50"
                        >
                          <Download size={16} />
                          {downloading === invoice.id ? 'Downloading...' : 'Download'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const handleDownload = async (invoiceId) => {
    setDownloading(invoiceId)
    try {
      console.log('Downloading invoice:', invoiceId)
      
      // Fetch invoice data directly from Supabase
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id(full_name, email, address, user_id)
        `)
        .eq('id', invoiceId)
        .single()

      if (invoiceError) {
        console.error('Invoice error:', invoiceError)
        throw new Error(`Invoice not found: ${invoiceError.message}`)
      }

      console.log('Invoice found:', invoice.invoice_number)

      // Generate HTML content
      const htmlContent = generateInvoiceHTML(invoice)
      
      // Create a complete HTML document
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice #${invoice.invoice_number || invoice.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
            .container { max-width: 800px; margin: 0 auto; padding: 30px; border: 1px solid #ddd; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; }
            .header h1 { color: #1a1a1a; margin: 0; font-size: 28px; }
            .header p { color: #666; margin: 5px 0; }
            .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-section { flex: 1; }
            .info-section h3 { color: #1a1a1a; margin: 0 0 10px 0; font-size: 16px; }
            .info-section p { margin: 5px 0; color: #333; font-size: 14px; }
            .breakdown { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .breakdown th { background: #f8f9fa; padding: 12px; text-align: left; border: 1px solid #333; font-weight: bold; }
            .breakdown td { padding: 12px; border: 1px solid #333; }
            .breakdown .text-right { text-align: right; }
            .total { text-align: right; font-size: 18px; font-weight: bold; color: #1a1a1a; }
            .status { text-align: center; padding: 10px; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .status.paid { background: #d4edda; color: #155724; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; text-align: center; color: #666; }
            @media print { body { padding: 0; } .container { border: none; }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            // Force print dialog
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
            
            // Handle print completion
            window.onafterprint = function() {
              setTimeout(function() {
                window.close();
              }, 1000);
            };
          </script>
        </body>
        </html>
      `
      
      // Create blob and download as PDF
      const blob = new Blob([fullHtml], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Also open in new window for print option
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      printWindow.document.write(fullHtml)
      printWindow.document.close()
      
      toast.success('Invoice downloaded! You can also print the opened window to save as PDF.')
      console.log('Invoice downloaded and print window opened')
      
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast.error(`Error generating invoice: ${error.message}`)
    } finally {
      setDownloading(null)
    }
  }

// Generate HTML content for invoice
const generateInvoiceHTML = (invoice) => {
  const paidDate = invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : ''
  const createdDate = new Date(invoice.created_at).toLocaleDateString()

  return `
    <div class="container">
      <div class="header">
        <h1>Trusted Mobile Detailing</h1>
        <p>Professional Car Detailing Services</p>
        <p><strong>Invoice #${invoice.invoice_number || invoice.id}</strong></p>
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
          <p><strong>Invoice Date:</strong> ${createdDate}</p>
          ${paidDate ? `<p><strong>Paid Date:</strong> ${paidDate}</p>` : ''}
          <p><strong>Status:</strong> ${invoice.status || 'draft'}</p>
        </div>
      </div>

      ${invoice.status === 'paid' ? '<div class="status paid">✓ PAID</div>' : ''}

      <h3>Payment Breakdown:</h3>
      <table class="breakdown">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Service Amount</td>
            <td class="text-right">$${invoice.base_amount || invoice.total || '0.00'}</td>
          </tr>
          ${invoice.platform_fees ? `
          <tr>
            <td>Platform Fees (4%)</td>
            <td class="text-right">$${invoice.platform_fees}</td>
          </tr>
          ` : ''}
          ${invoice.stripe_fees ? `
          <tr>
            <td>Stripe Processing Fees</td>
            <td class="text-right">$${invoice.stripe_fees}</td>
          </tr>
          ` : ''}
          ${invoice.total_fees ? `
          <tr>
            <td>Total Fees</td>
            <td class="text-right">$${invoice.total_fees}</td>
          </tr>
          ` : ''}
        </tbody>
        <tfoot>
          <tr>
            <td class="total">Total Charged:</td>
            <td class="total">$${invoice.total_charged || invoice.total || '0.00'}</td>
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
  `
}

export default ClientInvoices
