-- EMERGENCY RECOVERY - Recreate Essential Tables
-- Run this immediately in Supabase SQL Editor

-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Vehicles table  
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id),
  make text NOT NULL,
  model text NOT NULL,
  year integer,
  color text,
  license_plate text,
  vehicle_size VARCHAR(20) DEFAULT 'sedan',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  base_price numeric NOT NULL,
  duration_minutes integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id),
  vehicle_id uuid REFERENCES public.vehicles(id),
  service_id uuid REFERENCES public.services(id),
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  status text DEFAULT 'scheduled',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text NOT NULL UNIQUE,
  client_id uuid REFERENCES public.clients(id),
  status text DEFAULT 'draft',
  subtotal numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric DEFAULT 0,
  base_amount numeric,
  stripe_fees numeric,
  platform_fees numeric,
  total_fees numeric,
  total_charged numeric,
  paid_at timestamp with time zone,
  stripe_payment_intent_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES public.invoices(id),
  description text NOT NULL,
  quantity integer DEFAULT 1,
  unit_price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Payment tracking tables (if they don't exist)
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES public.invoices(id),
  client_id uuid REFERENCES public.clients(id),
  payment_intent_id text,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  ip_address inet,
  user_agent text,
  location jsonb,
  device_fingerprint text,
  payment_method text,
  card_last4 text,
  card_brand text,
  card_country text,
  card_exp_month text,
  card_exp_year text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_details (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_attempt_id uuid REFERENCES public.payment_attempts(id),
  stripe_payment_intent_id text,
  stripe_payment_method_id text,
  stripe_charge_id text,
  stripe_customer_id text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  application_fee_amount numeric DEFAULT 0,
  application_fee_currency text DEFAULT 'usd',
  transfer_amount numeric DEFAULT 0,
  transfer_currency text DEFAULT 'usd',
  outcome text,
  network_status text,
  reason text,
  risk_level text CHECK (risk_level IN ('normal', 'elevated', 'high')),
  risk_score numeric,
  fraud_signals jsonb,
  stripe_produced jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fraud_detection (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_attempt_id uuid REFERENCES public.payment_attempts(id),
  fraud_score numeric NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('normal', 'elevated', 'high')),
  signals jsonb,
  rules_triggered jsonb,
  machine_learning_result jsonb,
  manual_review boolean DEFAULT false,
  reviewed_by uuid,
  review_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_status_updates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_attempt_id uuid REFERENCES public.payment_attempts(id),
  old_status text,
  new_status text NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_status_updates ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you may need to adjust these)
CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users can insert own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = client_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON public.vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_invoice_id ON public.payment_attempts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_client_id ON public.payment_attempts(client_id);
