# Quick Start Guide - Trusted Mobile Detailing

## ✅ What Was Built

### Complete Full-Scale Business Management System

**Frontend:**
- ✅ Premium mobile detailing website (9 pages)
- ✅ Login/Register system
- ✅ Admin dashboard with CMS
- ✅ Client portal with vehicle management

**Backend:**
- ✅ Supabase database (11 tables with RLS)
- ✅ Authentication & user roles
- ✅ Email notifications (Resend integration)
- ✅ Payment processing (Stripe ready)
- ✅ Booking management system

---

## 🚀 Getting Started (3 Steps)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create account at https://supabase.com
2. Create new project
3. Go to SQL Editor → paste `supabase/schema.sql` → run
4. Copy Project URL and anon key to `.env`

### 3. Run the App

```bash
npm run dev
```

Visit: `http://localhost:5173`

---

## 📍 Important URLs

| Page | URL | Description |
|------|-----|-------------|
| **Public Site** | `/` | Main website |
| **Book Now** | `/book-now` | Booking form (saves to DB + email) |
| **Login** | `/login` | Admin/Client login |
| **Register** | `/register` | Client registration |
| **Admin Dashboard** | `/admin` | Full CMS panel (admin only) |
| **Client Portal** | `/client-portal` | Customer dashboard (clients only) |

---

## 👤 User Roles

### Admin
- Full CMS access
- Manage all bookings
- Manage clients & vehicles
- View payments
- Approve reviews
- Access analytics

### Client
- Personal dashboard
- Add/manage vehicles
- View booking history
- Make payments
- Request new bookings

### Public (No Login)
- Browse website
- Request quotes
- Submit contact forms
- View services

---

## 📧 Email Notifications

Automatically sent when:
- Quote requested → Owner + Customer
- Booking confirmed → Customer
- Service completed → Customer
- Contact form submitted → Owner

**Setup Required:**
1. Get Resend API key (free)
2. Deploy Supabase Edge Function
3. Configure email addresses in `.env`

---

## 💳 Payment System (Stripe)

**Features:**
- Save payment methods
- Process payments
- Refund management
- Webhook integration

**Setup Required:**
1. Stripe account
2. Add keys to `.env`
3. Configure webhooks (optional)

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User auth & roles |
| `clients` | Customer data |
| `vehicles` | Customer vehicles |
| `bookings` | Service appointments |
| `services` | Service packages |
| `add_ons` | Optional services |
| `payments` | Payment records |
| `quote_requests` | Quote submissions |
| `contact_submissions` | Contact messages |
| `email_logs` | Email tracking |
| `reviews` | Customer reviews |

---

## 🎯 Admin Dashboard Features

**Bookings Management**
- View all bookings
- Update status (pending → confirmed → completed)
- Filter by status
- View booking details
- Create manual bookings

**Client Management**
- View all clients
- Client profiles
- Total spent tracking
- Booking history
- Vehicle management

**Services & Pricing**
- Update service prices
- Manage add-ons
- Enable/disable services

**Quote Requests**
- View new quotes
- Customer contact info
- Service details

**Communications**
- Contact form messages
- Email logs
- Client messaging

---

## 💻 Client Portal Features

**Dashboard**
- Booking statistics
- Total spent
- Active vehicles
- Upcoming appointments

**My Vehicles**
- Add vehicles
- Edit details
- View history
- Delete vehicles

**Bookings**
- View all bookings
- Booking status
- Payment status
- Cancel bookings

**Payments**
- Saved payment methods
- Payment history
- Add credit cards

---

## 🔐 Creating Admin User

Run in Supabase SQL Editor:

```sql
-- Create admin account
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'YOUR_USER_ID_FROM_AUTH',
  'admin@yourdomain.com',
  'Admin Name',
  'admin'
);
```

Or register normally and manually update role in Supabase.

---

## 📝 Environment Variables Needed

```env
# Supabase (Required)
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Stripe (Optional - for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Resend (Optional - for emails)
RESEND_API_KEY=re_...
BUSINESS_EMAIL=info@yourdomain.com
OWNER_EMAIL=owner@yourdomain.com
```

---

## 🧪 Test the System

### Test Quote Request
1. Go to `/book-now`
2. Fill form (no login needed)
3. Submit
4. Check admin dashboard → Quote Requests
5. Email sent to owner (if configured)

### Test Client Flow
1. Go to `/register`
2. Create account
3. Redirects to `/client-portal`
4. Add a vehicle
5. Create booking

### Test Admin Flow
1. Go to `/login`
2. Login with admin account
3. Access `/admin`
4. View bookings, clients, quotes

---

## 🎨 Brand Colors

```css
Navy Deep: #0B1C2D
Navy Dark: #102A44
Electric Blue: #1DB7E8
Bright Cyan: #29D3FF
Metallic Silver: #C8CED6
Light Gray: #AAB2BD
```

---

## 📂 File Structure

```
src/
├── components/
│   ├── Navigation.jsx          # Main nav bar
│   ├── FloatingCallButton.jsx  # Mobile call button
│   └── ProtectedRoute.jsx      # Auth guards
├── pages/
│   ├── Home.jsx               # Homepage
│   ├── BookNowV2.jsx          # Booking form (DB integrated)
│   ├── Login.jsx              # Login page
│   ├── Register.jsx           # Registration
│   ├── admin/
│   │   ├── AdminLayout.jsx    # Admin sidebar
│   │   ├── Dashboard.jsx      # Admin home
│   │   ├── Bookings.jsx       # Manage bookings
│   │   └── Clients.jsx        # Manage clients
│   └── client/
│       └── ClientPortal.jsx   # Client dashboard
├── lib/
│   ├── supabase.js           # Supabase client
│   └── stripe.js             # Stripe config
├── store/
│   └── authStore.js          # Auth state (Zustand)
└── utils/
    └── emailService.js       # Email functions

supabase/
├── schema.sql                # Database schema
└── functions/
    └── send-quote-notification/
        └── index.ts          # Email edge function
```

---

## 🐛 Common Issues

**"Supabase is not defined"**
- Check `.env` file exists
- Restart dev server after adding env vars

**"Not authorized"**
- Check user role in profiles table
- Verify RLS policies are enabled

**Emails not sending**
- Deploy Supabase Edge Function
- Check Resend API key
- Verify function secrets set

**Can't login as admin**
- Check profiles table has role='admin'
- Verify email matches auth.users

---

## 🚀 Deployment

See `BACKEND_SETUP.md` for full deployment guide.

**Quick Deploy:**
1. Build: `npm run build`
2. Deploy to Vercel/Netlify
3. Set environment variables
4. Deploy Supabase functions
5. Update Stripe webhooks

---

## 📚 Full Documentation

- `BACKEND_SETUP.md` - Complete setup guide
- `README.md` - Project overview
- Supabase Dashboard - Database admin
- Stripe Dashboard - Payment admin

---

**Need help? Check the comprehensive `BACKEND_SETUP.md` guide!**
