-- Complete fix for all payment functions
-- Drop and recreate all functions with exact parameter matching

-- Drop all existing functions
DROP FUNCTION IF EXISTS public.record_payment_attempt CASCADE;
DROP FUNCTION IF EXISTS public.record_payment_details CASCADE;
DROP FUNCTION IF EXISTS public.update_payment_attempt_details CASCADE;
DROP FUNCTION IF EXISTS public.update_payment_attempt_status CASCADE;

-- 1. Record Payment Attempt Function
CREATE OR REPLACE FUNCTION public.record_payment_attempt(
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
  card_last4_param text DEFAULT NULL,
  card_brand_param text DEFAULT NULL,
  card_country_param text DEFAULT NULL,
  card_exp_month_param text DEFAULT NULL,
  card_exp_year_param text DEFAULT NULL,
  stripe_produced_param jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    stripe_produced,
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
    stripe_produced_param,
    NOW(),
    NOW()
  ) RETURNING id INTO payment_attempt_id;
  
  RETURN payment_attempt_id;
END;
$$;

-- 2. Record Payment Details Function
CREATE OR REPLACE FUNCTION public.record_payment_details(
  payment_attempt_id_param uuid,
  stripe_payment_intent_id_param text DEFAULT NULL,
  stripe_payment_method_id_param text DEFAULT NULL,
  stripe_charge_id_param text DEFAULT NULL,
  stripe_customer_id_param text DEFAULT NULL,
  amount_param numeric DEFAULT NULL,
  currency_param text DEFAULT NULL,
  outcome_param text DEFAULT NULL,
  network_status_param text DEFAULT NULL,
  reason_param text DEFAULT NULL,
  risk_level_param text DEFAULT NULL,
  risk_score_param numeric DEFAULT NULL,
  fraud_signals_param jsonb DEFAULT NULL,
  stripe_produced_param jsonb DEFAULT NULL,
  application_fee_amount_param numeric DEFAULT NULL,
  application_fee_currency_param text DEFAULT NULL,
  transfer_amount_param numeric DEFAULT NULL,
  transfer_currency_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update payment attempt with detailed payment information
  UPDATE public.payment_attempts SET
    stripe_payment_intent_id = stripe_payment_intent_id_param,
    stripe_payment_method_id = stripe_payment_method_id_param,
    stripe_charge_id = stripe_charge_id_param,
    stripe_customer_id = stripe_customer_id_param,
    stripe_amount = amount_param,
    stripe_currency = currency_param,
    stripe_outcome = outcome_param,
    stripe_network_status = network_status_param,
    stripe_reason = reason_param,
    stripe_risk_level = risk_level_param,
    stripe_risk_score = risk_score_param,
    stripe_fraud_signals = fraud_signals_param,
    stripe_produced = stripe_produced_param,
    stripe_application_fee_amount = application_fee_amount_param,
    stripe_application_fee_currency = application_fee_currency_param,
    stripe_transfer_amount = transfer_amount_param,
    stripe_transfer_currency = transfer_currency_param,
    updated_at = NOW()
  WHERE id = payment_attempt_id_param;
END;
$$;

-- 3. Update Payment Attempt Details Function
CREATE OR REPLACE FUNCTION public.update_payment_attempt_details(
  payment_attempt_id_param uuid,
  card_brand_param text DEFAULT NULL,
  card_last4_param text DEFAULT NULL,
  card_exp_month_param text DEFAULT NULL,
  card_exp_year_param text DEFAULT NULL,
  card_country_param text DEFAULT NULL,
  card_fingerprint_param text DEFAULT NULL,
  card_funding_param text DEFAULT NULL,
  bank_bin_param text DEFAULT NULL,
  bank_name_param text DEFAULT NULL,
  bank_country_param text DEFAULT NULL,
  card_scheme_param text DEFAULT NULL,
  failure_reason_param text DEFAULT NULL,
  failure_code_param text DEFAULT NULL,
  decline_code_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update payment attempt with card and bank details
  UPDATE public.payment_attempts SET
    card_brand = card_brand_param,
    card_last4 = card_last4_param,
    card_exp_month = card_exp_month_param,
    card_exp_year = card_exp_year_param,
    card_country = card_country_param,
    card_fingerprint = card_fingerprint_param,
    card_funding = card_funding_param,
    bank_bin = bank_bin_param,
    bank_name = bank_name_param,
    bank_country = bank_country_param,
    card_scheme = card_scheme_param,
    failure_reason = failure_reason_param,
    failure_code = failure_code_param,
    decline_code = decline_code_param,
    updated_at = NOW()
  WHERE id = payment_attempt_id_param;
END;
$$;

-- 4. Update Payment Attempt Status Function
CREATE OR REPLACE FUNCTION public.update_payment_attempt_status(
  payment_attempt_id_param uuid,
  new_status_param text,
  reason_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update payment attempt status
  UPDATE public.payment_attempts SET
    status = new_status_param,
    failure_reason = reason_param,
    updated_at = NOW()
  WHERE id = payment_attempt_id_param;
END;
$$;

-- Grant execute permissions to all functions
GRANT EXECUTE ON FUNCTION public.record_payment_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment_attempt TO anon;
GRANT EXECUTE ON FUNCTION public.record_payment_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment_details TO anon;
GRANT EXECUTE ON FUNCTION public.update_payment_attempt_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_attempt_details TO anon;
GRANT EXECUTE ON FUNCTION public.update_payment_attempt_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_attempt_status TO anon;

-- Verify all functions were created
SELECT 
  proname as function_name,
  pronargs as parameter_count,
  proargnames as parameter_names
FROM pg_proc 
WHERE proname IN ('record_payment_attempt', 'record_payment_details', 'update_payment_attempt_details', 'update_payment_attempt_status')
ORDER BY proname;
