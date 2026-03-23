-- DISABLE RLS FOR ALL TABLES
-- This turns off Row Level Security to eliminate recursion issues

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_add_ons DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_detection DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_status_updates DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies (optional cleanup)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything with clients" ON clients;
DROP POLICY IF EXISTS "Clients can view own data" ON clients;
DROP POLICY IF EXISTS "Clients can update own data" ON clients;
DROP POLICY IF EXISTS "Admins can manage all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Clients can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Clients can manage own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
DROP POLICY IF EXISTS "Admins can manage services" ON services;
DROP POLICY IF EXISTS "Anyone can view active add-ons" ON add_ons;
DROP POLICY IF EXISTS "Admins can manage add-ons" ON add_ons;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can create bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;
DROP POLICY IF EXISTS "Clients can view own payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all invoices" ON invoices;
DROP POLICY IF EXISTS "Clients can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Clients can insert own invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can view contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Anyone can create contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Admins can view quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Anyone can create quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Clients can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view own 2FA data" ON two_factor_auth;
DROP POLICY IF EXISTS "Users can insert own 2FA data" ON two_factor_auth;
DROP POLICY IF EXISTS "Users can update own 2FA data" ON two_factor_auth;
DROP POLICY IF EXISTS "Users can delete own 2FA data" ON two_factor_auth;
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
DROP POLICY IF EXISTS "Anyone can view basic settings" ON settings;

-- Drop payment tracking RLS policies
DROP POLICY IF EXISTS "Users can view their own payment attempts" ON public.payment_attempts;
DROP POLICY IF EXISTS "Users can insert their own payment attempts" ON public.payment_attempts;
DROP POLICY IF EXISTS "Users can update their own payment attempts" ON public.payment_attempts;
DROP POLICY IF EXISTS "Users can view their own payment details" ON public.payment_details;
DROP POLICY IF EXISTS "Users can insert their own payment details" ON public.payment_details;
DROP POLICY IF EXISTS "Users can view their own fraud detection" ON public.fraud_detection;
DROP POLICY IF EXISTS "Users can insert their own fraud detection" ON public.fraud_detection;
DROP POLICY IF EXISTS "Users can view their own payment status updates" ON public.payment_status_updates;
DROP POLICY IF EXISTS "Users can insert their own payment status updates" ON public.payment_status_updates;

-- Drop helper function
DROP FUNCTION IF EXISTS is_admin(user_uuid UUID);

SELECT 'RLS DISABLED for all tables - No more recursion issues!' as status;
