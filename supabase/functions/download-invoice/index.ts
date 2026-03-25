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
    console.log('Download function called, method:', req.method)
    
    // Check for API key in Authorization header instead of JWT
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract API key from Authorization header
    const apiKey = authHeader.replace('Bearer ', '').replace('Bearer ', '')
    console.log('API key length:', apiKey.length)
    
    // Expected API key (you'll need to provide this)
    const expectedApiKey = Deno.env.get('EXPECTED_API_KEY') || 'your-service-role-key-here'
    
    if (apiKey !== expectedApiKey) {
      console.log('Invalid API key')
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('API key validated')

    const requestBody = await req.json()
    console.log('Request body:', requestBody)
    const { invoiceId } = requestBody

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'Invoice ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Supabase URL present:', !!supabaseUrl)
    console.log('Service key present:', !!supabaseServiceKey)

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        clients:client_id(full_name, email, address, user_id)
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError) {
      console.error('Invoice error:', invoiceError)
      return new Response(
        JSON.stringify({ error: 'Invoice not found', details: invoiceError.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Invoice found:', invoice.invoice_number)
    console.log('Invoice client:', invoice.clients?.full_name)

    // Generate PDF content
    const pdfContent = await generatePDFContent(invoice)
    console.log('PDF content generated, length:', pdfContent.length)

    // Return PDF as downloadable file
    return new Response(pdfContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number || invoice.id}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generatePDFContent(invoice: any) {
  console.log('Generating PDF for invoice:', invoice.id)
  
  // Generate HTML content
  const htmlContent = generateInvoiceHTML(invoice)
  console.log('HTML content generated')
  
  try {
    // Use HTML to PDF conversion service
    console.log('Calling HTML2PDF API...')
    const response = await fetch('https://api.html2pdf.app/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        fileName: `invoice-${invoice.invoice_number || invoice.id}`,
        format: 'A4',
        margin: '20mm',
      }),
    })

    if (response.ok) {
      console.log('HTML2PDF response OK')
      const pdfBuffer = await response.arrayBuffer()
      return new Uint8Array(pdfBuffer)
    } else {
      console.log('HTML2PDF failed:', response.status, response.statusText)
      const errorText = await response.text()
      console.log('Error response:', errorText)
    }
  } catch (error) {
    console.log('HTML2PDF error:', error)
  }

  // Fallback: Return HTML as printable content
  console.log('Using HTML fallback')
  return new TextEncoder().encode(htmlContent)
}

function generateInvoiceHTML(invoice: any) {
  const paidDate = invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : ''
  const createdDate = new Date(invoice.created_at).toLocaleDateString()

  return `
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
        @media print { body { padding: 0; } .container { border: none; } }
      </style>
    </head>
    <body>
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
    </body>
    </html>
  `
}
