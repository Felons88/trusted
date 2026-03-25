-- Add update policy for payment_attempts to allow users to update their own attempts
-- This fixes the RLS violation when updating payment attempt details

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update their own payment attempts" ON public.payment_attempts;

-- Create update policy for payment_attempts
CREATE POLICY "Users can update their own payment attempts" ON public.payment_attempts
  FOR UPDATE USING (
    auth.uid() = (SELECT client_id FROM public.invoices WHERE id = invoice_id)
  );

-- Also ensure admin can update any payment attempt
CREATE POLICY "Admins can update any payment attempts" ON public.payment_attempts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
