-- Force drop all payment functions by their specific signatures
-- This will resolve the duplicate function name conflicts

-- First, let's see what functions exist and drop them specifically
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Drop all functions with payment-related names
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname IN ('record_payment_attempt', 'record_payment_details', 'update_payment_attempt_details')
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%s(%s) CASCADE', func_record.proname, func_record.args);
        RAISE NOTICE 'Dropped function: %', format('public.%s(%s)', func_record.proname, func_record.args);
    END LOOP;
END $$;

-- Now recreate the functions with clean signatures

-- record_payment_attempt function
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
AS $$
DECLARE
  payment_attempt_id uuid;
BEGIN
  INSERT INTO public.payment_attempts (
    invoice_id, client_id, payment_intent_id, status, amount, currency,
    ip_address, user_agent, location, device_fingerprint, payment_method,
    card_last4, card_brand, card_country, card_exp_month, card_exp_year,
    created_at, updated_at
  ) VALUES (
    invoice_id_param, client_id_param, payment_intent_id_param, status_param, amount_param, currency_param,
    ip_address_param, user_agent_param, location_param, device_fingerprint_param, payment_method_param,
    card_last4_param, card_brand_param, card_country_param, card_exp_month_param, card_exp_year_param,
    now(), now()
  ) RETURNING id INTO payment_attempt_id;
  
  INSERT INTO public.payment_status_updates (
    payment_attempt_id, old_status, new_status, reason, created_at
  ) VALUES (
    payment_attempt_id_param, NULL, status_param, 'Payment attempt created', now()
  );
  
  RETURN payment_attempt_id;
END;
$$;

-- record_payment_details function
CREATE OR REPLACE FUNCTION public.record_payment_details(
  payment_attempt_id_param uuid,
  stripe_payment_intent_id_param text DEFAULT NULL,
  stripe_payment_method_id_param text DEFAULT NULL,
  stripe_charge_id_param text DEFAULT NULL,
  stripe_customer_id_param text DEFAULT NULL,
  amount_param numeric DEFAULT NULL,
  currency_param text DEFAULT 'usd',
  outcome_param text DEFAULT NULL,
  network_status_param text DEFAULT NULL,
  reason_param text DEFAULT NULL,
  risk_level_param text DEFAULT NULL,
  risk_score_param numeric DEFAULT NULL,
  fraud_signals_param jsonb DEFAULT NULL,
  stripe_produced_param jsonb DEFAULT NULL,
  application_fee_amount_param numeric DEFAULT 0,
  application_fee_currency_param text DEFAULT 'usd',
  transfer_amount_param numeric DEFAULT 0,
  transfer_currency_param text DEFAULT 'usd'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment_detail_id uuid;
BEGIN
  INSERT INTO public.payment_details (
    payment_attempt_id, stripe_payment_intent_id, stripe_payment_method_id, stripe_charge_id, stripe_customer_id,
    amount, currency, outcome, network_status, reason, risk_level, risk_score, fraud_signals, stripe_produced,
    application_fee_amount, application_fee_currency, transfer_amount, transfer_currency, created_at, updated_at
  ) VALUES (
    payment_attempt_id_param, stripe_payment_intent_id_param, stripe_payment_method_id_param, stripe_charge_id_param, stripe_customer_id_param,
    amount_param, currency_param, outcome_param, network_status_param, reason_param, risk_level_param, risk_score_param, fraud_signals_param, stripe_produced_param,
    application_fee_amount_param, application_fee_currency_param, transfer_amount_param, transfer_currency_param, now(), now()
  ) RETURNING id INTO payment_detail_id;
  
  RETURN payment_detail_id;
END;
$$;

-- update_payment_attempt_details function
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
  failure_reason_param text DEFAULT NULL,
  failure_code_param text DEFAULT NULL,
  decline_code_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.payment_attempts 
  SET 
    card_brand = card_brand_param,
    card_last4 = card_last4_param,
    card_exp_month = card_exp_month_param,
    card_exp_year = card_exp_year_param,
    card_country = card_country_param,
    card_fingerprint = card_fingerprint_param,
    card_funding = card_funding_param,
    bank_bin = bank_bin_param,
    bank_name = bank_name_param,
    failure_reason = failure_reason_param,
    failure_code = failure_code_param,
    decline_code = decline_code_param,
    updated_at = now()
  WHERE id = payment_attempt_id_param;
  
  INSERT INTO public.payment_status_updates (
    payment_attempt_id, old_status, new_status, reason, created_at
  )
  SELECT 
    payment_attempt_id_param, status, status,
    'Updated payment attempt details: ' || COALESCE(failure_reason_param, 'Card details captured'), now()
  FROM public.payment_attempts
  WHERE id = payment_attempt_id_param;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.record_payment_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_attempt_details TO authenticated;
