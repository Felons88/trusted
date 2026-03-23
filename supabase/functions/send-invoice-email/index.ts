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
    
    console.log('Function called with:', { invoiceId, clientEmail, clientName })

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

    console.log('Environment check:', {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
      supabaseAnonKey: !!supabaseAnonKey,
      brevoApiKey: !!brevoApiKey
    })

    if (!supabaseUrl || !supabaseServiceKey || !brevoApiKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with service role key for full database access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Querying invoice with ID:', invoiceId)

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, clients:client_id(full_name, email, address), invoice_items(*)')
      .eq('id', invoiceId)
      .single()

    console.log('Database query result:', { invoice: invoice, error: error })

    if (error || !invoice) {
      console.error('Invoice query failed:', error)
      return new Response(
        JSON.stringify({ error: 'Invoice not found', details: { invoiceId, dbError: error } }),
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
          email: 'noreply@trustedmobiledetailing.com'
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
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0)
  const total = invoice.total || subtotal

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice #${invoice.invoice_number || invoice.id}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background: #f5f5f5; 
          color: #333;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          text-align: center; 
          padding: 20px; 
          border-bottom: 2px solid #1DB7E8; 
          background: #f8f9fa;
        }
        .header h1 { 
          color: #0B1C2D; 
          margin: 0 0 5px 0; 
          font-size: 24px;
        }
        .info { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 15px; 
          margin: 20px;
        }
        .info-box { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 5px;
          font-size: 14px;
        }
        .table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
          font-size: 14px;
        }
        .table th { 
          background: #0B1C2D; 
          color: white; 
          padding: 10px; 
          text-align: left; 
          font-weight: 600;
        }
        .table td { 
          padding: 10px; 
          border-bottom: 1px solid #e9ecef; 
        }
        .text-right { text-align: right; }
        .pay-section { 
          text-align: center; 
          margin: 20px; 
          padding: 20px; 
          background: linear-gradient(135deg, #1DB7E8, #0FA9CE);
          border-radius: 5px;
        }
        .pay-button { 
          display: inline-block; 
          background: #28a745; 
          color: white; 
          text-decoration: none; 
          padding: 12px 30px; 
          border-radius: 25px; 
          font-weight: 600; 
          margin-bottom: 10px;
        }
        .footer { 
          text-align: center; 
          margin-top: 20px; 
          padding-top: 15px; 
          border-top: 1px solid #e9ecef; 
          font-size: 12px; 
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Trusted Mobile Detailing</h1>
          <p><strong>Invoice #${invoice.invoice_number || invoice.id}</strong></p>
        </div>
        
        <div class="info">
          <div class="info-box">
            <strong>Bill To:</strong><br>
            ${invoice.clients?.full_name || 'Client'}<br>
            ${invoice.clients?.email || ''}
          </div>
          <div class="info-box">
            <strong>Details:</strong><br>
            Date: ${new Date(invoice.created_at).toLocaleDateString()}<br>
            Status: ${invoice.status?.toUpperCase() || 'DRAFT'}
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Service</th>
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
                <td class="text-right"><strong>$${(item.quantity * item.unit_price).toFixed(2)}</strong></td>
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

        <div class="pay-section">
          <div style="color: white; font-size: 18px; margin-bottom: 10px;">
            <strong>Total: $${total.toFixed(2)}</strong>
          </div>
          <a href="https://trustedmobiledetailing.com/payment/${invoice.id}" class="pay-button">
            💳 Pay Now
          </a>
          <div style="color: white; font-size: 11px;">
            Secure payment processing
          </div>
        </div>

        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>📞 (612) 525-3137 | 📧 info@trustedmobiledetailing.com</p>
          <p>329 Morton Ave, Elk River, MN 55330</p>
        </div>
      </div>
    </body>
    </html>
  `
}
