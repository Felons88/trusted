-- Fix record_payment_details function parameter mismatch
-- Drop and recreate with correct parameter signature

DROP FUNCTION IF EXISTS public.record_payment_details CASCADE;

CREATE OR REPLACE FUNCTION public.record_payment_details(
  payment_attempt_id_param uuid,
  stripe_payment_intent_id text DEFAULT NULL,
  stripe_payment_method_id text DEFAULT NULL,
  stripe_charge_id text DEFAULT NULL,
  stripe_customer_id text DEFAULT NULL,
  amount numeric DEFAULT NULL,
  currency text DEFAULT NULL,
  outcome text DEFAULT NULL,
  network_status text DEFAULT NULL,
  reason text DEFAULT NULL,
  risk_level text DEFAULT NULL,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.record_payment_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment_details TO anon;

-- Verify function was created
SELECT 
  proname as function_name,
  pronargs as parameter_count,
  proargnames as parameter_names
FROM pg_proc 
WHERE proname = 'record_payment_details';
