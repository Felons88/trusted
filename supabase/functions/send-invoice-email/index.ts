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
          padding: 15px; 
          background: #f5f5f5; 
          color: #333;
          font-size: 12px;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          text-align: center; 
          padding: 15px; 
          border-bottom: 2px solid #1DB7E8; 
          background: #f8f9fa;
        }
        .header h1 { 
          color: #0B1C2D; 
          margin: 0 0 5px 0; 
          font-size: 20px;
        }
        .company-info {
          font-size: 11px;
          color: #666;
          margin-top: 5px;
        }
        .info { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 15px; 
          margin: 15px;
        }
        .info-box { 
          background: #f8f9fa; 
          padding: 12px; 
          border-radius: 5px;
          font-size: 12px;
        }
        .table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0;
          font-size: 12px;
        }
        .table th { 
          background: #0B1C2D; 
          color: white; 
          padding: 8px; 
          text-align: left; 
          font-weight: 600;
          font-size: 11px;
        }
        .table td { 
          padding: 8px; 
          border-bottom: 1px solid #e9ecef; 
        }
        .text-right { text-align: right; }
        .pay-section { 
          text-align: center; 
          margin: 15px; 
          padding: 15px; 
          background: linear-gradient(135deg, #1DB7E8, #0FA9CE);
          border-radius: 5px;
        }
        .pay-button { 
          display: inline-block; 
          background: #28a745; 
          color: white; 
          text-decoration: none; 
          padding: 10px 25px; 
          border-radius: 25px; 
          font-weight: 600; 
          margin-bottom: 8px;
          font-size: 14px;
        }
        .footer { 
          text-align: center; 
          margin-top: 15px; 
          padding-top: 12px; 
          border-top: 1px solid #e9ecef; 
          font-size: 10px; 
          color: #666;
        }
        .total-row {
          font-weight: bold;
          background: #f8f9fa;
        }
        .total-row td {
          padding: 10px 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Trusted Mobile Detailing</h1>
          <div class="company-info">
            Professional Auto Detailing Services | Elk River, MN
          </div>
          <p><strong>Invoice #${invoice.invoice_number || invoice.id}</strong></p>
        </div>
        
        <div class="info">
          <div class="info-box">
            <strong>Bill To:</strong><br>
            ${invoice.clients?.full_name || 'Client'}<br>
            ${invoice.clients?.email || ''}<br>
            ${invoice.clients?.address || ''}
          </div>
          <div class="info-box">
            <strong>Invoice Details:</strong><br>
            Date: ${new Date(invoice.created_at).toLocaleDateString()}<br>
            Due: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Due on receipt'}<br>
            Status: ${invoice.status?.toUpperCase() || 'DRAFT'}
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 50%">Service Description</th>
              <th style="width: 15%" class="text-right">Qty</th>
              <th style="width: 15%" class="text-right">Price</th>
              <th style="width: 20%" class="text-right">Total</th>
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
            <tr class="total-row">
              <td colspan="3" class="text-right"><strong>Total Amount:</strong></td>
              <td class="text-right"><strong>$${total.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>

        <div class="pay-section">
          <div style="color: white; font-size: 16px; margin-bottom: 8px;">
            <strong>Total Due: $${total.toFixed(2)}</strong>
          </div>
          <a href="https://trustedmobiledetailing.com/payment/${invoice.id}" class="pay-button">
            💳 Pay Invoice Online
          </a>
          <div style="color: white; font-size: 10px;">
            Secure payment processing via Stripe
          </div>
        </div>

        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>📞 (612) 525-3137 | 📧 info@trustedmobiledetailing.com</p>
          <p>329 Morton Ave, Elk River, MN 55330 | Licensed & Insured</p>
        </div>
      </div>
    </body>
    </html>
  `
}
