-- DEBUG: Create minimal functions to see what parameters are actually being sent

-- Drop existing functions
DROP FUNCTION IF EXISTS public.record_payment_details CASCADE;
DROP FUNCTION IF EXISTS public.record_payment_attempt CASCADE;
DROP FUNCTION IF EXISTS public.update_payment_attempt_details CASCADE;
DROP FUNCTION IF EXISTS public.update_payment_status CASCADE;
DROP FUNCTION IF EXISTS public.record_fraud_detection CASCADE;

-- Create a debug version that accepts any JSONB parameter
CREATE OR REPLACE FUNCTION public.record_payment_details(
  payment_attempt_id_param uuid,
  debug_params jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Just log what we received - don't try to update anything yet
  RAISE NOTICE 'record_payment_details called with payment_attempt_id: %, debug_params: %', 
    payment_attempt_id_param, debug_params;
  
  -- For now, just update the timestamp to show it was called
  UPDATE public.payment_attempts 
  SET updated_at = NOW() 
  WHERE id = payment_attempt_id_param;
END;
$$;

-- Also create a debug version for record_payment_attempt
CREATE OR REPLACE FUNCTION public.record_payment_attempt(
  invoice_id_param uuid,
  client_id_param uuid,
  debug_params jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_attempt_id uuid;
BEGIN
  -- Extract data from debug_params - only use columns that exist
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
    created_at,
    updated_at
  ) VALUES (
    invoice_id_param,
    client_id_param,
    (debug_params->>'payment_intent_id_param')::text,
    (debug_params->>'status_param')::text,
    (debug_params->>'amount_param')::numeric,
    (debug_params->>'currency_param')::text,
    (debug_params->>'ip_address_param')::inet,
    (debug_params->>'user_agent_param')::text,
    (debug_params->'location_param')::jsonb,
    (debug_params->>'device_fingerprint_param')::text,
    (debug_params->>'payment_method_param')::text,
    NOW(),
    NOW()
  ) RETURNING id INTO payment_attempt_id;
  
  -- Log what we received
  RAISE NOTICE 'record_payment_attempt called with invoice_id: %, client_id: %, amount: %', 
    invoice_id_param, client_id_param, (debug_params->>'amount_param')::numeric;
  
  RETURN payment_attempt_id;
END;
$$;

-- Create a debug version for update_payment_attempt_details
CREATE OR REPLACE FUNCTION public.update_payment_attempt_details(
  payment_attempt_id_param uuid,
  debug_params jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Extract and update card and bank details from debug_params
  UPDATE public.payment_attempts SET
    card_brand = (debug_params->>'card_brand_param')::text,
    card_last4 = (debug_params->>'card_last4_param')::text,
    card_exp_month = (debug_params->>'card_exp_month_param')::text,
    card_exp_year = (debug_params->>'card_exp_year_param')::text,
    card_country = (debug_params->>'card_country_param')::text,
    card_fingerprint = (debug_params->>'card_fingerprint_param')::text,
    card_funding = (debug_params->>'card_funding_param')::text,
    bank_bin = (debug_params->>'bank_bin_param')::text,
    bank_name = (debug_params->>'bank_name_param')::text,
    bank_country = (debug_params->>'bank_country_param')::text,
    card_scheme = (debug_params->>'card_scheme_param')::text,
    failure_reason = (debug_params->>'failure_reason_param')::text,
    failure_code = (debug_params->>'failure_code_param')::text,
    decline_code = (debug_params->>'decline_code_param')::text,
    updated_at = NOW()
  WHERE id = payment_attempt_id_param;
  
  RAISE NOTICE 'update_payment_attempt_details updated card details for payment_attempt_id: %', payment_attempt_id_param;
END;
$$;

-- Create a debug version for update_payment_status
CREATE OR REPLACE FUNCTION public.update_payment_status(
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
  -- Just log what we received
  RAISE NOTICE 'update_payment_status called with payment_attempt_id: %, status: %, reason: %', 
    payment_attempt_id_param, new_status_param, reason_param;
  
  -- Update the status
  UPDATE public.payment_attempts 
  SET status = new_status_param, updated_at = NOW() 
  WHERE id = payment_attempt_id_param;
END;
$$;

-- Create a debug version for record_fraud_detection
CREATE OR REPLACE FUNCTION public.record_fraud_detection(
  payment_attempt_id_param uuid,
  fraud_score_param numeric,
  risk_level_param text,
  fraud_signals_param jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Just log what we received
  RAISE NOTICE 'record_fraud_detection called with payment_attempt_id: %, fraud_score: %, risk_level: %, signals: %', 
    payment_attempt_id_param, fraud_score_param, risk_level_param, fraud_signals_param;
  
  -- For now, just update the timestamp to show it was called
  UPDATE public.payment_attempts 
  SET updated_at = NOW() 
  WHERE id = payment_attempt_id_param;
END;
$$;

-- Grant permissions to all functions
GRANT EXECUTE ON FUNCTION public.record_payment_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment_details TO anon;
GRANT EXECUTE ON FUNCTION public.record_payment_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment_attempt TO anon;
GRANT EXECUTE ON FUNCTION public.update_payment_attempt_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_attempt_details TO anon;
GRANT EXECUTE ON FUNCTION public.update_payment_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_status TO anon;
GRANT EXECUTE ON FUNCTION public.record_fraud_detection TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_fraud_detection TO anon;

-- Verify all functions were created
SELECT 
  proname as function_name,
  pronargs as parameter_count,
  proargnames as parameter_names
FROM pg_proc 
WHERE proname IN ('record_payment_attempt', 'record_payment_details', 'update_payment_attempt_details', 'update_payment_status', 'record_fraud_detection')
ORDER BY proname;
