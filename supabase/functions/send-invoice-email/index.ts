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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !brevoApiKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with anon key for public access
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, clients:client_id(full_name, email, address), invoice_items(*)')
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const invoiceHTML = createInvoiceHTML(invoice)

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Trusted Mobile Detailing',
          email: 'invoices@trustedmobiledetailing.com'
        },
        to: [{ email: clientEmail, name: clientName }],
        subject: `Invoice #${invoice.invoice_number || invoice.id}`,
        htmlContent: invoiceHTML,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      throw new Error(`Email failed: ${errorData}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function createInvoiceHTML(invoice: any) {
  const items = invoice.invoice_items || []
  const total = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 12px; border: 1px solid #ddd; text-align: left; }
        .table th { background: #f5f5f5; }
        .text-right { text-align: right; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Trusted Mobile Detailing</h1>
          <p>Invoice #${invoice.invoice_number || invoice.id}</p>
        </div>
        
        <div class="info">
          <div>
            <h3>Bill To:</h3>
            <p>${invoice.clients?.full_name}</p>
            <p>${invoice.clients?.email}</p>
          </div>
          <div>
            <h3>Details:</h3>
            <p>Date: ${new Date(invoice.created_at).toLocaleDateString()}</p>
            <p>Status: ${invoice.status}</p>
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
              <td colspan="3" class="text-right"><strong>Total:</strong></td>
              <td class="text-right"><strong>$${total.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </body>
    </html>
  `
}
