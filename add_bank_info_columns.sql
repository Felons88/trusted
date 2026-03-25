-- Add missing columns for bank information to payment_attempts table
-- This ensures all bank details can be stored properly

ALTER TABLE public.payment_attempts 
ADD COLUMN IF NOT EXISTS bank_country text,
ADD COLUMN IF NOT EXISTS card_scheme text;

-- Add comments for documentation
COMMENT ON COLUMN public.payment_attempts.bank_country IS 'Country of the issuing bank from BIN lookup';
COMMENT ON COLUMN public.payment_attempts.card_scheme IS 'Card scheme/network (VISA, MASTERCARD, etc.)';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_attempts_bank_country ON public.payment_attempts(bank_country);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_card_scheme ON public.payment_attempts(card_scheme);

-- Update existing function to handle the new columns
DROP FUNCTION IF EXISTS public.update_payment_attempt_details CASCADE;

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
    bank_country = bank_country_param,
    card_scheme = card_scheme_param,
    failure_reason = failure_reason_param,
    failure_code = failure_code_param,
    decline_code = decline_code_param,
    updated_at = now()
  WHERE id = payment_attempt_id_param;
  
  INSERT INTO public.payment_status_updates (
    payment_attempt_id, old_status, new_status, reason, created_at
  )
  SELECT 
    payment_attempt_id_param, 
    status, 
    status, 
    'Updated payment attempt details: ' || COALESCE(failure_reason_param, 'Card details captured'), 
    now()
  FROM public.payment_attempts
  WHERE id = payment_attempt_id_param;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_payment_attempt_details TO authenticated;
