-- COMPLETE DATABASE RECOVERY SCRIPT WITH ADMIN USERS
-- Run this ENTIRE script in Supabase SQL Editor to recreate your entire database
-- This includes all tables, indexes, RLS policies, functions, default data, and admin users

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('admin', 'client');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'refunded');
CREATE TYPE service_type AS ENUM ('exterior', 'interior', 'full');
CREATE TYPE vehicle_size AS ENUM ('sedan', 'suv', 'truck', 'van');

-- Users/Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table (for managing customer data)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  year INTEGER,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  color TEXT,
  license_plate TEXT,
  vin TEXT,
  size vehicle_size NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services/Packages table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type service_type NOT NULL,
  base_price_sedan DECIMAL(10, 2),
  base_price_suv DECIMAL(10, 2),
  base_price_truck DECIMAL(10, 2),
  base_price_van DECIMAL(10, 2),
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add-ons table
CREATE TABLE IF NOT EXISTS add_ons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id),
  status booking_status DEFAULT 'pending',
  service_type service_type NOT NULL,
  vehicle_size vehicle_size NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  actual_date DATE,
  actual_time TIME,
  service_address TEXT NOT NULL,
  service_city TEXT,
  service_state TEXT,
  service_zip TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Booking add-ons junction table
CREATE TABLE IF NOT EXISTS booking_add_ons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  add_on_id UUID REFERENCES add_ons(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  status payment_status DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Invoices table (for payment system)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES clients(id),
  status TEXT DEFAULT 'draft',
  subtotal DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  base_amount DECIMAL(10, 2),
  stripe_fees DECIMAL(10, 2),
  platform_fees DECIMAL(10, 2),
  total_fees DECIMAL(10, 2),
  total_charged DECIMAL(10, 2),
  paid_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id),
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote requests table
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_year INTEGER,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_size vehicle_size NOT NULL,
  service_type service_type NOT NULL,
  add_ons JSONB,
  preferred_date DATE,
  preferred_time TEXT,
  address TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'new',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Two Factor Auth table
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  backup_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment tracking tables
CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id),
  client_id UUID REFERENCES public.clients(id),
  payment_intent_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  ip_address INET,
  user_agent TEXT,
  location JSONB,
  device_fingerprint TEXT,
  payment_method TEXT,
  card_last4 TEXT,
  card_brand TEXT,
  card_country TEXT,
  card_exp_month TEXT,
  card_exp_year TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_attempt_id UUID REFERENCES public.payment_attempts(id),
  stripe_payment_intent_id TEXT,
  stripe_payment_method_id TEXT,
  stripe_charge_id TEXT,
  stripe_customer_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  application_fee_amount NUMERIC DEFAULT 0,
  application_fee_currency TEXT DEFAULT 'usd',
  transfer_amount NUMERIC DEFAULT 0,
  transfer_currency TEXT DEFAULT 'usd',
  outcome TEXT,
  network_status TEXT,
  reason TEXT,
  risk_level TEXT CHECK (risk_level IN ('normal', 'elevated', 'high')),
  risk_score NUMERIC,
  fraud_signals JSONB,
  stripe_produced JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fraud_detection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_attempt_id UUID REFERENCES public.payment_attempts(id),
  fraud_score NUMERIC NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('normal', 'elevated', 'high')),
  signals JSONB,
  rules_triggered JSONB,
  machine_learning_result JSONB,
  manual_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_attempt_id UUID REFERENCES public.payment_attempts(id),
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_read ON contact_submissions(is_read);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_enabled ON two_factor_auth(enabled, user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_invoice_id ON public.payment_attempts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_client_id ON public.payment_attempts(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON public.payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_created_at ON public.payment_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_details_payment_intent_id ON public.payment_details(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_payment_attempt_id ON public.fraud_detection(payment_attempt_id);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_fraud_score ON public.fraud_detection(fraud_score);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_risk_level ON public.fraud_detection(risk_level);
CREATE INDEX IF NOT EXISTS idx_payment_status_updates_payment_attempt_id ON public.payment_status_updates(payment_attempt_id);

-- Function to generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(booking_number FROM 5) AS INTEGER)), 0) + 1
  INTO counter
  FROM bookings
  WHERE booking_number LIKE 'TMD-%';
  
  new_number := 'TMD-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate booking number
CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := generate_booking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_number
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_add_ons_updated_at BEFORE UPDATE ON add_ons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_two_factor_auth_updated_at BEFORE UPDATE ON two_factor_auth FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Payment tracking functions (fixed versions)
CREATE OR REPLACE FUNCTION update_payment_status(
  payment_attempt_id_param UUID,
  new_status_param TEXT,
  reason_param TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the payment attempt status
  UPDATE public.payment_attempts 
  SET 
    status = new_status_param,
    updated_at = NOW()
  WHERE id = payment_attempt_id_param;
  
  -- Log the status change
  INSERT INTO public.payment_status_updates (
    payment_attempt_id,
    old_status,
    new_status,
    reason
  )
  SELECT 
    payment_attempt_id_param,
    status,
    new_status_param,
    reason_param
  FROM public.payment_attempts
  WHERE id = payment_attempt_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION record_payment_attempt(
  invoice_id_param UUID,
  client_id_param UUID,
  payment_intent_id_param TEXT,
  status_param TEXT,
  amount_param NUMERIC,
  currency_param TEXT,
  ip_address_param INET,
  user_agent_param TEXT,
  location_param JSONB,
  device_fingerprint_param TEXT,
  payment_method_param TEXT,
  card_last4_param TEXT,
  card_brand_param TEXT,
  card_country_param TEXT,
  card_exp_month_param TEXT,
  card_exp_year_param TEXT,
  stripe_produced_param JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  payment_attempt_id UUID;
BEGIN
  -- Create payment attempt record
  INSERT INTO public.payment_attempts (
    invoice_id,
    client_id,
    payment_intent_id,
    status,
    amount,
    currency,
    ip_address,
    user_agent,
    location,
    device_fingerprint,
    payment_method,
    card_last4,
    card_brand,
    card_country,
    card_exp_month,
    card_exp_year,
    created_at,
    updated_at
  ) VALUES (
    invoice_id_param,
    client_id_param,
    payment_intent_id_param,
    status_param,
    amount_param,
    currency_param,
    ip_address_param,
    user_agent_param,
    location_param,
    device_fingerprint_param,
    payment_method_param,
    card_last4_param,
    card_brand_param,
    card_country_param,
    card_exp_month_param,
    card_exp_year_param,
    NOW(),
    NOW()
  ) RETURNING id;
  
  -- Return the created payment attempt ID
  SELECT id INTO payment_attempt_id;
  
  -- Log initial status change
  INSERT INTO public.payment_status_updates (
    payment_attempt_id,
    old_status,
    new_status,
    reason
  )
  SELECT 
    payment_attempt_id_param,
    NULL,
    status_param,
    'Payment attempt created';
  
  RETURN payment_attempt_id;
END;
$$;

CREATE OR REPLACE FUNCTION record_payment_details(
  payment_attempt_id_param UUID,
  stripe_payment_intent_id_param TEXT,
  stripe_payment_method_id_param TEXT,
  stripe_charge_id_param TEXT,
  stripe_customer_id_param TEXT,
  amount_param NUMERIC,
  currency_param TEXT,
  outcome_param TEXT,
  network_status_param TEXT,
  reason_param TEXT,
  risk_level_param TEXT,
  risk_score_param NUMERIC,
  fraud_signals_param JSONB,
  stripe_produced_param JSONB,
  application_fee_amount_param NUMERIC DEFAULT 0,
  application_fee_currency_param TEXT DEFAULT 'usd',
  transfer_amount_param NUMERIC DEFAULT 0,
  transfer_currency_param TEXT DEFAULT 'usd'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  payment_detail_id UUID;
BEGIN
  -- Create payment detail record
  INSERT INTO public.payment_details (
    payment_attempt_id,
    stripe_payment_intent_id,
    stripe_payment_method_id,
    stripe_charge_id,
    stripe_customer_id,
    amount,
    currency,
    outcome,
    network_status,
    reason,
    risk_level,
    risk_score,
    fraud_signals,
    stripe_produced,
    application_fee_amount,
    application_fee_currency,
    transfer_amount,
    transfer_currency,
    created_at,
    updated_at
  ) VALUES (
    payment_attempt_id_param,
    stripe_payment_intent_id_param,
    stripe_payment_method_id_param,
    stripe_charge_id_param,
    stripe_customer_id_param,
    amount_param,
    currency_param,
    outcome_param,
    network_status_param,
    reason_param,
    risk_level_param,
    risk_score_param,
    fraud_signals_param,
    stripe_produced_param,
    application_fee_amount_param,
    application_fee_currency_param,
    transfer_amount_param,
    transfer_currency_param,
    NOW(),
    NOW()
  ) RETURNING id;
  
  -- Return the created payment detail ID
  SELECT id INTO payment_detail_id;
  
  RETURN payment_detail_id;
END;
$$;

CREATE OR REPLACE FUNCTION record_fraud_detection(
  payment_attempt_id_param UUID,
  fraud_score_param NUMERIC,
  risk_level_param TEXT,
  signals_param JSONB,
  rules_triggered_param JSONB,
  machine_learning_result_param JSONB,
  manual_review_param BOOLEAN DEFAULT false,
  reviewed_by_param UUID DEFAULT NULL,
  review_notes_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  fraud_detection_id UUID;
BEGIN
  -- Create fraud detection record
  INSERT INTO public.fraud_detection (
    payment_attempt_id,
    fraud_score,
    risk_level,
    signals,
    rules_triggered,
    machine_learning_result,
    manual_review,
    reviewed_by,
    review_notes,
    created_at,
    updated_at
  ) VALUES (
    payment_attempt_id_param,
    fraud_score_param,
    risk_level_param,
    signals_param,
    rules_triggered_param,
    machine_learning_result_param,
    manual_review_param,
    reviewed_by_param,
    review_notes_param,
    NOW(),
    NOW()
  ) RETURNING id;
  
  -- Return the created fraud detection ID
  SELECT id INTO fraud_detection_id;
  
  RETURN fraud_detection_id;
END;
$$;

-- Insert default services
INSERT INTO services (name, description, type, base_price_sedan, base_price_suv, base_price_truck, base_price_van, duration_minutes) VALUES
  ('Exterior Detail', 'Complete exterior wash, wax, and protection', 'exterior', 99.99, 129.99, 139.99, 149.99, 120),
  ('Interior Detail', 'Deep interior cleaning and conditioning', 'interior', 119.99, 149.99, 159.99, 169.99, 150),
  ('Full Detail', 'Complete interior and exterior detailing', 'full', 199.99, 249.99, 269.99, 289.99, 240)
ON CONFLICT DO NOTHING;

-- Insert default add-ons
INSERT INTO add_ons (name, description, price, category) VALUES
  ('Carpet Extraction', 'Deep clean carpets and remove embedded dirt and stains', 50.00, 'Interior'),
  ('Pet Hair Removal', 'Thorough removal of stubborn pet hair from all surfaces', 25.00, 'Interior'),
  ('Vinyl & Plastics Rejuvenation', 'Restore and protect interior plastic and vinyl surfaces', 25.00, 'Interior'),
  ('Leather Treatment', 'Clean, condition, and protect leather seats', 25.00, 'Interior'),
  ('Spray Sealant', 'Enhanced paint protection with extended water beading', 20.00, 'Exterior'),
  ('Headlight Restoration', 'Restore clarity and brightness to oxidized headlights', 50.00, 'Exterior'),
  ('Engine Bay Cleaning', 'Professional cleaning and dressing of engine compartment', 50.00, 'Exterior'),
  ('Trim Restoration', 'Revitalize faded exterior plastic and rubber trim', 25.00, 'Exterior'),
  ('Tar / Sap Removal', 'Safe removal of tar, sap, and stubborn contaminants', 25.00, 'Exterior')
ON CONFLICT DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_status_updates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Clients policies
CREATE POLICY "Admins can do everything with clients" ON clients FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Clients can view own data" ON clients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Clients can update own data" ON clients FOR UPDATE USING (user_id = auth.uid());

-- Vehicles policies
CREATE POLICY "Admins can manage all vehicles" ON vehicles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Clients can view own vehicles" ON vehicles FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE id = vehicles.client_id AND user_id = auth.uid())
);
CREATE POLICY "Clients can manage own vehicles" ON vehicles FOR ALL USING (
  EXISTS (SELECT 1 FROM clients WHERE id = vehicles.client_id AND user_id = auth.uid())
);

-- Services policies (public read, admin write)
CREATE POLICY "Anyone can view active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage services" ON services FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add-ons policies (public read, admin write)
CREATE POLICY "Anyone can view active add-ons" ON add_ons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage add-ons" ON add_ons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Bookings policies
CREATE POLICY "Admins can manage all bookings" ON bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Clients can view own bookings" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE id = bookings.client_id AND user_id = auth.uid())
);
CREATE POLICY "Clients can create bookings" ON bookings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clients WHERE id = bookings.client_id AND user_id = auth.uid())
);

-- Booking add-ons policies
CREATE POLICY "Admins can manage booking add-ons" ON booking_add_ons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Clients can view own booking add-ons" ON booking_add_ons FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings b 
    JOIN clients c ON b.client_id = c.id 
    WHERE b.id = booking_add_ons.booking_id AND c.user_id = auth.uid()
  )
);

-- Payments policies
CREATE POLICY "Admins can manage all payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Clients can view own payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE id = payments.client_id AND user_id = auth.uid())
);

-- Invoices policies
CREATE POLICY "Admins can manage all invoices" ON invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Clients can view own invoices" ON invoices FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE id = invoices.client_id AND user_id = auth.uid())
);
CREATE POLICY "Clients can insert own invoices" ON invoices FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clients WHERE id = invoices.client_id AND user_id = auth.uid())
);

-- Invoice items policies
CREATE POLICY "Admins can manage invoice items" ON invoice_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Clients can view own invoice items" ON invoice_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.id = invoice_items.invoice_id AND c.user_id = auth.uid()
  )
);

-- Contact submissions (admin only)
CREATE POLICY "Admins can view contact submissions" ON contact_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can create contact submissions" ON contact_submissions FOR INSERT WITH CHECK (true);

-- Quote requests (admin only read, anyone can create)
CREATE POLICY "Admins can view quote requests" ON quote_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can create quote requests" ON quote_requests FOR INSERT WITH CHECK (true);

-- Email logs (admin only)
CREATE POLICY "Admins can view email logs" ON email_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews policies
CREATE POLICY "Admins can manage all reviews" ON reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can view approved reviews" ON reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Clients can create reviews" ON reviews FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clients WHERE id = reviews.client_id AND user_id = auth.uid())
);

-- Two Factor Auth policies
CREATE POLICY "Users can view own 2FA data" ON two_factor_auth FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own 2FA data" ON two_factor_auth FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own 2FA data" ON two_factor_auth FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own 2FA data" ON two_factor_auth FOR DELETE USING (auth.uid() = user_id);

-- Payment tracking RLS policies
CREATE POLICY "Users can view their own payment attempts" ON public.payment_attempts FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.clients WHERE id = client_id)
);
CREATE POLICY "Users can insert their own payment attempts" ON public.payment_attempts FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.clients WHERE id = client_id)
);
CREATE POLICY "Users can update their own payment attempts" ON public.payment_attempts FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM public.clients WHERE id = client_id)
);

CREATE POLICY "Users can view their own payment details" ON public.payment_details FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.payment_attempts pa
    JOIN public.clients i ON i.id = pa.client_id
    WHERE pa.id = payment_attempt_id AND i.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert their own payment details" ON public.payment_details FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.payment_attempts pa
    JOIN public.clients i ON i.id = pa.client_id
    WHERE pa.id = payment_attempt_id AND i.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own fraud detection" ON public.fraud_detection FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.payment_attempts pa
    JOIN public.clients i ON i.id = pa.client_id
    WHERE pa.id = payment_attempt_id AND i.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert their own fraud detection" ON public.fraud_detection FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.payment_attempts pa
    JOIN public.clients i ON i.id = pa.client_id
    WHERE pa.id = payment_attempt_id AND i.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own payment status updates" ON public.payment_status_updates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.payment_attempts pa
    JOIN public.clients i ON i.id = pa.client_id
    WHERE pa.id = payment_attempt_id AND i.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert their own payment status updates" ON public.payment_status_updates FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.payment_attempts pa
    JOIN public.clients i ON i.id = pa.client_id
    WHERE pa.id = payment_attempt_id AND i.user_id = auth.uid()
  )
);

-- CREATE ADMIN USERS
-- Note: These users will need to sign up first through the app, then this script will promote them to admin

-- Function to promote existing users to admin
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_id UUID;
  profile_id UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RETURN 'User not found: ' || user_email || '. User must sign up first.';
  END IF;
  
  -- Update or insert profile with admin role
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (user_id, user_email, 
    CASE 
      WHEN user_email = 'jameshewitt312@gmail.com' THEN 'James Hewitt'
      WHEN user_email = 'daniel2002@' THEN 'Daniel'
      ELSE 'Admin User'
    END, 
    'admin')
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'admin',
    updated_at = NOW();
  
  RETURN 'User promoted to admin: ' || user_email;
END;
$$ LANGUAGE plpgsql;

-- Promote James to admin
SELECT promote_user_to_admin('jameshewitt312@gmail.com') as james_result;

-- Promote Daniel to admin (assuming full email, adjust if needed)
SELECT promote_user_to_admin('daniel2002@') as daniel_result;

-- Check admin users
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  au.email_confirmed_at,
  CASE 
    WHEN p.role = 'admin' THEN '✓ ADMIN'
    ELSE 'CLIENT'
  END as user_type
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.role = 'admin'
ORDER BY p.created_at;

-- Success message
SELECT 'DATABASE RECOVERY COMPLETE - All tables, functions, policies, and admin users have been created!' as status;
