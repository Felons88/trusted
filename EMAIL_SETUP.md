# Email Function Setup Guide

## 📧 Setup Email Invoice Function

### 1. Deploy the Function
```bash
supabase functions deploy email-invoice
```

### 2. Add Environment Variable
Go to your Supabase Dashboard:
1. Navigate to **Edge Functions**
2. Select **email-invoice** function
3. Click **Settings** tab
4. Add Environment Variable:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Your Resend API key

### 3. Get Resend API Key
1. Sign up at [resend.com](https://resend.com)
2. Go to Dashboard → API Keys
3. Create new API key
4. Copy the key and add to environment variables

### 4. Test the Function
1. Go to your client invoices page
2. Click the **Email** button on any paid invoice
3. Check the client's email inbox
4. You should receive a beautiful HTML invoice!

## 🎨 Features
- ✅ Professional HTML email template
- ✅ Mobile responsive design
- ✅ Complete payment breakdown
- ✅ Company branding
- ✅ Error handling
- ✅ CORS enabled

## 🔧 Troubleshooting
- **"Email service not configured"** → Add RESEND_API_KEY environment variable
- **"Failed to send email"** → Check your Resend API key is valid
- **Function not found** → Deploy the function with the command above

## 📱 Expected Result
Client receives a beautiful email invoice with:
- Professional header with your logo
- Invoice number and date
- Payment breakdown (service amount, platform fees, stripe fees)
- Total charged amount
- Paid status badge
- Company contact information
