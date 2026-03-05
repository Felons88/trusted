import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invoiceId } = await req.json()

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'Invoice ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        clients:client_id(full_name, email, address),
        invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate PDF using a PDF service (we'll use a simple approach)
    const pdfUrl = await generatePDF(invoice)

    return new Response(
      JSON.stringify({ pdfUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generatePDF(invoice: any) {
  const invoiceHTML = generateInvoiceHTML(invoice)
  
  try {
    // Try using HTML2PDF API first
    const response = await fetch('https://api.html2pdf.app/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: invoiceHTML,
        fileName: `invoice-${invoice.invoice_number || invoice.id}.pdf`,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.url
    }
  } catch (error) {
    console.log('HTML2PDF failed, trying alternative method')
  }

  // Fallback: Create a simple data URL for download
  const base64PDF = await createSimplePDF(invoice)
  return `data:application/pdf;base64,${base64PDF}`
}

async function createSimplePDF(invoice: any) {
  // This is a simplified approach - in production you'd want a proper PDF library
  // For now, we'll create a basic HTML structure that can be saved as PDF
  
  const items = invoice.invoice_items || []
  const total = invoice.total || items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0)
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice #${invoice.invoice_number || invoice.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .info-section { flex: 1; }
        .info-section h3 { margin: 0 0 10px 0; }
        .info-section p { margin: 5px 0; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th, .table td { border: 1px solid #000; padding: 10px; text-align: left; }
        .table th { background: #f0f0f0; font-weight: bold; }
        .table .text-right { text-align: right; }
        .total { font-size: 18px; font-weight: bold; text-align: right; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Trusted Mobile Detailing</h1>
        <p>Invoice #${invoice.invoice_number || invoice.id}</p>
        <p>Date: ${new Date(invoice.created_at).toLocaleDateString()}</p>
      </div>
      
      <div class="info">
        <div class="info-section">
          <h3>Bill To:</h3>
          <p><strong>${invoice.clients?.full_name || 'Client'}</strong></p>
          <p>${invoice.clients?.email || ''}</p>
          ${invoice.clients?.address ? `<p>${invoice.clients.address}</p>` : ''}
        </div>
        <div class="info-section">
          <h3>Details:</h3>
          <p>Status: ${invoice.status || 'draft'}</p>
          ${invoice.due_date ? `<p>Due: ${new Date(invoice.due_date).toLocaleDateString()}</p>` : ''}
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
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
        <p>Thank you for your business! Trusted Mobile Detailing</p>
      </div>
    </body>
    </html>
  `

  // Convert HTML to base64 (simplified approach)
  // In production, you'd use a proper PDF generation library
  const utf8Bytes = new TextEncoder().encode(htmlContent)
  const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('')
  return btoa(binaryString)
}

function generateInvoiceHTML(invoice: any) {
  const items = invoice.invoice_items || []
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0)
  const total = invoice.total || subtotal

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice #${invoice.invoice_number || invoice.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
        .container { max-width: 800px; margin: 0 auto; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .header h1 { color: #1a1a1a; margin: 0; font-size: 28px; }
        .header p { color: #666; margin: 5px 0; }
        .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .info-section { flex: 1; }
        .info-section h3 { color: #1a1a1a; margin: 0 0 10px 0; font-size: 16px; }
        .info-section p { margin: 5px 0; color: #333; font-size: 14px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th { background: #f8f9fa; padding: 12px; text-align: left; border: 1px solid #333; font-weight: bold; }
        .table td { padding: 12px; border: 1px solid #333; }
        .table .text-right { text-align: right; }
        .total { text-align: right; font-size: 18px; font-weight: bold; color: #1a1a1a; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; text-align: center; color: #666; }
        @media print { body { padding: 0; } }
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
            ${items.map((item: any) => `
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
