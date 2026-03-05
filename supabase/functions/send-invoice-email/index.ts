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
    const { invoiceId, clientEmail, clientName } = await req.json()

    if (!invoiceId || !clientEmail || !clientName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // Generate invoice HTML
    const invoiceHTML = generateInvoiceHTML(invoice)

    // Send email using Brevo SMTP API
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': Deno.env.get('BREVO_API_KEY'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Trusted Mobile Detailing',
          email: 'invoices@trustedmobile detailing.com'
        },
        to: [{
          email: clientEmail,
          name: clientName
        }],
        subject: `Invoice #${invoice.invoice_number || invoice.id} from Trusted Mobile Detailing`,
        htmlContent: invoiceHTML,
      }),
    })

    if (!brevoResponse.ok) {
      const error = await brevoResponse.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Invoice sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending invoice email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

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
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #1a1a1a; margin: 0; }
        .header p { color: #666; margin: 5px 0; }
        .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .info-section { flex: 1; }
        .info-section h3 { color: #1a1a1a; margin: 0 0 10px 0; }
        .info-section p { margin: 5px 0; color: #333; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; }
        .table td { padding: 12px; border-bottom: 1px solid #dee2e6; }
        .table .text-right { text-align: right; }
        .total { text-align: right; font-size: 18px; font-weight: bold; color: #1a1a1a; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #666; }
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
            <h3>Invoice To:</h3>
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
          <div class="notes">
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
