# Supabase Setup Instructions

## 1. Database Setup

Run the `FRESH-SUPABASE-SETUP.sql` script in your new Supabase SQL Editor:
- URL: https://sezccnoarnxfipbyrsqh.supabase.co
- Go to SQL Editor and paste the entire script
- Execute to create all tables, functions, and policies

## 2. Environment Variables

Set these environment variables in your Supabase project:

### In Supabase Dashboard → Settings → Edge Functions:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Your Stripe webhook secret

# Supabase Configuration (auto-filled by Supabase)
SUPABASE_URL=https://sezccnoarnxfipbyrsqh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemNjbm9hcm54ZmlwYnlyc3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDE4OTcsImV4cCI6MjA4OTg3Nzg5N30.NIBYJrGktesB3weTbWTh107b10dKe29JXA1g6Ghezuo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemNjbm9hcm54ZmlwYnlyc3FoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMwMTg5NywiZXhwIjoyMDg5ODc3ODk3fQ.9RpneMSikF5MD50hrkAvr04mjLs-zplA-HGZreK55og
```

## 3. Edge Functions Deployment

Deploy the Edge Functions using the Supabase CLI:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref sezccnoarnxfipbyrsqh

# Deploy all functions
supabase functions deploy stripe-payments
supabase functions deploy booking-management
supabase functions deploy stripe-webhooks
supabase functions deploy email-service
```

## 4. Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://sezccnoarnxfipbyrsqh.supabase.co/functions/v1/stripe-webhooks`
3. Select events to send:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - payment_intent.canceled
   - charge.succeeded
   - invoice.payment_succeeded
   - invoice.payment_failed
4. Copy the webhook secret and add to environment variables

## 5. Frontend Configuration

Update your frontend environment variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://sezccnoarnxfipbyrsqh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemNjbm9hcm54ZmlwYnlyc3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDE4OTcsImV4cCI6MjA4OTg3Nzg5N30.NIBYJrGktesB3weTbWTh107b10dKe29JXA1g6Ghezuo

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key

# Application Configuration
VITE_APP_URL=http://localhost:5173 # Your frontend URL
```

## 6. Create Admin Users

After running the database setup, create admin users:

1. Go to Supabase Dashboard → Authentication → Users
2. Create user: jameshewitt312@gmail.com with password: Daniel2002#
3. The user will be automatically promoted to admin when they sign in

## 7. Test the Setup

1. Test user registration and login
2. Test creating a booking
3. Test payment processing
4. Check that admin users can access all data

## API Endpoints

### Stripe Payments
- `POST /functions/v1/stripe-payments/create-payment-intent`
- `POST /functions/v1/stripe-payments/confirm-payment`
- `POST /functions/v1/stripe-payments/refund`
- `GET /functions/v1/stripe-payments/payment-status`

### Booking Management
- `GET /functions/v1/booking-management/bookings`
- `GET /functions/v1/booking-management/services`
- `GET /functions/v1/booking-management/add-ons`
- `POST /functions/v1/booking-management/create-booking`
- `PUT /functions/v1/booking-management/update-booking`

### Email Service
- `POST /functions/v1/email-service/send_booking_confirmation`
- `POST /functions/v1/email-service/send_payment_receipt`
- `GET /functions/v1/email-service/email-logs`

## Database Schema Summary

### Core Tables
- `profiles` - User profiles and roles
- `clients` - Client information
- `vehicles` - Vehicle details
- `services` - Service packages
- `add_ons` - Additional services
- `bookings` - Booking records
- `payments` - Payment records
- `invoices` - Invoice management

### Payment Tracking
- `payment_attempts` - Payment attempt logs
- `payment_details` - Detailed payment information
- `fraud_detection` - Fraud detection data
- `payment_status_updates` - Payment status history

### Communication
- `contact_submissions` - Contact form submissions
- `quote_requests` - Quote request forms
- `email_logs` - Email delivery logs
- `reviews` - Customer reviews

All tables have proper RLS policies, indexes, and relationships configured.
