-- MINIMAL RECOVERY SCRIPT - Only create missing tables
-- Based on check: clients, vehicles, services, bookings exist
-- Missing: profiles, payments, and payment tracking tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'client');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'refunded');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
        CREATE TYPE service_type AS ENUM ('exterior', 'interior', 'full');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_size') THEN
        CREATE TYPE vehicle_size AS ENUM ('sedan', 'suv', 'truck', 'van');
    END IF;
END $$;

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

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at on new tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_two_factor_auth_updated_at BEFORE UPDATE ON two_factor_auth FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Fixed payment tracking functions
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
  ) RETURNING id INTO payment_attempt_id;
  
  -- Log initial status change
  INSERT INTO public.payment_status_updates (
    payment_attempt_id,
    old_status,
    new_status,
    reason
  )
  VALUES (
    payment_attempt_id,
    NULL,
    status_param,
    'Payment attempt created'
  );
  
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
  ) RETURNING id INTO payment_detail_id;
  
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
  ) RETURNING id INTO fraud_detection_id;
  
  RETURN fraud_detection_id;
END;
$$;

-- Function to promote existing users to admin
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_id UUID;
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

-- Function to auto-promote specific users when they sign up
CREATE OR REPLACE FUNCTION auto_promote_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-promote James Hewitt
  IF NEW.email = 'jameshewitt312@gmail.com' THEN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, 'James Hewitt', 'admin')
    ON CONFLICT (id) DO UPDATE SET 
      role = 'admin',
      updated_at = NOW();
  END IF;
  
  -- Auto-promote Daniel (update with his full email)
  IF NEW.email = 'daniel2002@' THEN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, 'Daniel', 'admin')
    ON CONFLICT (id) DO UPDATE SET 
      role = 'admin',
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-promotion
DROP TRIGGER IF EXISTS auto_promote_admin_trigger ON auth.users;
CREATE TRIGGER auto_promote_admin_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auto_promote_admin();

-- Try to promote existing admin users
SELECT promote_user_to_admin('jameshewitt312@gmail.com') as james_result;

-- Success message
SELECT 'MINIMAL RECOVERY COMPLETE - Missing tables created with fixed functions!' as status;
