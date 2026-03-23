-- Fixed Payment Tracking Migration
-- Run this in Supabase SQL Editor

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.update_payment_status(uuid, text, text);
DROP FUNCTION IF EXISTS public.record_payment_attempt(uuid, uuid, text, text, numeric, text, inet, text, jsonb, text, text, text, text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.record_payment_details(uuid, text, text, text, text, numeric, text, text, text, text, text, numeric, jsonb, jsonb, numeric, text, numeric, text);
DROP FUNCTION IF EXISTS public.record_fraud_detection(uuid, numeric, text, jsonb, jsonb, jsonb, boolean, uuid, text);

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
