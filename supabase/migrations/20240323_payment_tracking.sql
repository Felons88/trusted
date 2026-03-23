-- Payment tracking and fraud detection tables

-- Payment attempts table - tracks all payment attempts (successful and failed)
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
  location jsonb, -- {country, city, region, lat, lon}
  device_fingerprint text, -- Browser/device fingerprint
  payment_method text, -- card, apple_pay, google_pay, etc.
  card_last4 text, -- Last 4 digits of card
  card_brand text, -- visa, mastercard, etc.
  card_country text,
  card_exp_month text,
  card_exp_year text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Payment details table - stores detailed payment information
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
  outcome text, -- authorized, captured, failed, voided
  network_status text, -- approved, declined, etc.
  reason text, -- decline reason if any
  risk_level text CHECK (risk_level IN ('normal', 'elevated', 'high')),
  risk_score numeric,
  fraud_signals jsonb, -- Array of fraud signals
  stripe_produced jsonb, -- Raw Stripe response data
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Fraud detection table - tracks fraud signals and risk assessments
CREATE TABLE IF NOT EXISTS public.fraud_detection (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_attempt_id uuid REFERENCES public.payment_attempts(id),
  fraud_score numeric NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('normal', 'elevated', 'high')),
  signals jsonb, -- Array of fraud signals with details
  rules_triggered jsonb, -- Array of fraud rules that were triggered
  machine_learning_result jsonb, -- ML model predictions
  manual_review boolean DEFAULT false,
  reviewed_by uuid REFERENCES public.profiles(id),
  review_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Payment status updates table - tracks changes in payment status
CREATE TABLE IF NOT EXISTS public.payment_status_updates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_attempt_id uuid REFERENCES public.payment_attempts(id),
  old_status text,
  new_status text NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_attempts_invoice_id ON public.payment_attempts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_client_id ON public.payment_attempts(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON public.payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_created_at ON public.payment_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_details_payment_intent_id ON public.payment_details(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_payment_attempt_id ON public.fraud_detection(payment_attempt_id);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_fraud_score ON public.fraud_detection(fraud_score);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_risk_level ON public.fraud_detection(risk_level);
CREATE INDEX IF NOT EXISTS idx_payment_status_updates_payment_attempt_id ON public.payment_status_updates(payment_attempt_id);

-- Create function to update payment status with logging
CREATE OR REPLACE FUNCTION update_payment_status(
  payment_attempt_id_param uuid,
  new_status_param text,
  reason_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the payment attempt status
  UPDATE public.payment_attempts 
  SET 
    status = new_status_param,
    updated_at = now()
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

-- Create function to record payment attempt
CREATE OR REPLACE FUNCTION record_payment_attempt(
  invoice_id_param uuid,
  client_id_param uuid,
  payment_intent_id_param text,
  status_param text,
  amount_param numeric,
  currency_param text,
  ip_address_param inet,
  user_agent_param text,
  location_param jsonb,
  device_fingerprint_param text,
  payment_method_param text,
  card_last4_param text,
  card_brand_param text,
  card_country_param text,
  card_exp_month_param text,
  card_exp_year_param text,
  stripe_produced_param jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  payment_attempt_id uuid;
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
    now(),
    now()
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

-- Create function to record payment details
CREATE OR REPLACE FUNCTION record_payment_details(
  payment_attempt_id_param uuid,
  stripe_payment_intent_id_param text,
  stripe_payment_method_id_param text,
  stripe_charge_id_param text,
  stripe_customer_id_param text,
  amount_param numeric,
  currency_param text,
  outcome_param text,
  network_status_param text,
  reason_param text,
  risk_level_param text,
  risk_score_param numeric,
  fraud_signals_param jsonb,
  stripe_produced_param jsonb,
  application_fee_amount_param numeric DEFAULT 0,
  application_fee_currency_param text DEFAULT 'usd',
  transfer_amount_param numeric DEFAULT 0,
  transfer_currency_param text DEFAULT 'usd'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  payment_detail_id uuid;
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
    now(),
    now()
  ) RETURNING id;
  
  -- Return the created payment detail ID
  SELECT id INTO payment_detail_id;
  
  RETURN payment_detail_id;
END;
$$;

-- Create function to record fraud detection
CREATE OR REPLACE FUNCTION record_fraud_detection(
  payment_attempt_id_param uuid,
  fraud_score_param numeric,
  risk_level_param text,
  signals_param jsonb,
  rules_triggered_param jsonb,
  machine_learning_result_param jsonb,
  manual_review_param boolean DEFAULT false,
  reviewed_by_param uuid DEFAULT NULL,
  review_notes_param text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  fraud_detection_id uuid;
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
    now(),
    now()
  ) RETURNING id;
  
  -- Return the created fraud detection ID
  SELECT id INTO fraud_detection_id;
  
  RETURN fraud_detection_id;
END;
$$;

-- Add RLS policies
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_status_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_attempts
CREATE POLICY "Users can view their own payment attempts" ON public.payment_attempts
  FOR SELECT USING (
    auth.uid() = (SELECT client_id FROM public.invoices WHERE id = invoice_id)
  );

CREATE POLICY "Users can insert their own payment attempts" ON public.payment_attempts
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT client_id FROM public.invoices WHERE id = invoice_id)
  );

CREATE POLICY "Users can update their own payment attempts" ON public.payment_attempts
  FOR UPDATE USING (
    auth.uid() = (SELECT client_id FROM public.invoices WHERE id = invoice_id)
  );

-- Add RLS policies for payment_details
CREATE POLICY "Users can view their own payment details" ON public.payment_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.payment_attempts pa
      JOIN public.invoices i ON i.id = pa.invoice_id
      WHERE pa.id = payment_attempt_id AND i.client_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own payment details" ON public.payment_details
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.payment_attempts pa
      JOIN public.invoices i ON i.id = pa.invoice_id
      WHERE pa.id = payment_attempt_id AND i.client_id = auth.uid()
    )
  );

-- Add RLS policies for fraud_detection
CREATE POLICY "Users can view their own fraud detection" ON public.fraud_detection
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.payment_attempts pa
      JOIN public.invoices i ON i.id = pa.invoice_id
      WHERE pa.id = payment_attempt_id AND i.client_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own fraud detection" ON public.fraud_detection
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.payment_attempts pa
      JOIN public.invoices i ON i.id = pa.invoice_id
      WHERE pa.id = payment_attempt_id AND i.client_id = auth.uid()
    )
  );

-- Add RLS policies for payment_status_updates
CREATE POLICY "Users can view their own payment status updates" ON public.payment_status_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.payment_attempts pa
      JOIN public.invoices i ON i.id = pa.invoice_id
      WHERE pa.id = payment_attempt_id AND i.client_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own payment status updates" ON public.payment_status_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.payment_attempts pa
      JOIN public.invoices i ON i.id = pa.invoice_id
      WHERE pa.id = payment_attempt_id AND i.client_id = auth.uid()
    )
  );

COMMENT ON TABLE public.payment_attempts IS 'Tracks all payment attempts including successful and failed ones';
COMMENT ON TABLE public.payment_details IS 'Stores detailed payment information from Stripe';
COMMENT ON TABLE public.fraud_detection IS 'Tracks fraud detection and risk assessment';
COMMENT ON TABLE public.payment_status_updates IS 'Tracks status changes for payment attempts';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_attempts_created_at ON public.payment_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON public.payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_details_created_at ON public.payment_details(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_created_at ON public.fraud_detection(created_at DESC);
