-- Add additional columns to payment_attempts table for enhanced tracking
-- This will capture detailed card information, bank data, and failure reasons

ALTER TABLE public.payment_attempts 
ADD COLUMN IF NOT EXISTS card_fingerprint text,
ADD COLUMN IF NOT EXISTS card_funding text, -- credit, debit, prepaid, etc.
ADD COLUMN IF NOT EXISTS bank_bin text, -- Bank Identification Number (first 6 digits)
ADD COLUMN IF NOT EXISTS bank_name text, -- Bank name from BIN lookup
ADD COLUMN IF NOT EXISTS failure_reason text, -- Detailed failure reason
ADD COLUMN IF NOT EXISTS failure_code text, -- Stripe failure code
ADD COLUMN IF NOT EXISTS decline_code text; -- Specific decline code

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_attempts_card_fingerprint ON public.payment_attempts(card_fingerprint);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_bank_bin ON public.payment_attempts(bank_bin);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_failure_code ON public.payment_attempts(failure_code);

-- Add comments
COMMENT ON COLUMN public.payment_attempts.card_fingerprint IS 'Unique card fingerprint from Stripe for identifying recurring cards';
COMMENT ON COLUMN public.payment_attempts.card_funding IS 'Card funding type: credit, debit, prepaid, unknown';
COMMENT ON COLUMN public.payment_attempts.bank_bin IS 'Bank Identification Number (first 6 digits of card number)';
COMMENT ON COLUMN public.payment_attempts.bank_name IS 'Bank name extracted from BIN lookup';
COMMENT ON COLUMN public.payment_attempts.failure_reason IS 'Human-readable failure reason from Stripe';
COMMENT ON COLUMN public.payment_attempts.failure_code IS 'Stripe error code for the failure';
COMMENT ON COLUMN public.payment_attempts.decline_code IS 'Specific decline code from Stripe';
