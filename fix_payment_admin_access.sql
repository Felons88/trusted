-- Add admin access policies for payment tracking tables
-- This allows admins to view all payment attempts and related data

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all payment attempts" ON public.payment_attempts;
DROP POLICY IF EXISTS "Admins can view all payment details" ON public.payment_details;
DROP POLICY IF EXISTS "Admins can view all fraud detection" ON public.fraud_detection;
DROP POLICY IF EXISTS "Admins can view all payment status updates" ON public.payment_status_updates;

-- Create admin policies for payment_attempts
CREATE POLICY "Admins can view all payment attempts" ON public.payment_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create admin policies for payment_details
CREATE POLICY "Admins can view all payment details" ON public.payment_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create admin policies for fraud_detection
CREATE POLICY "Admins can view all fraud detection" ON public.fraud_detection
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create admin policies for payment_status_updates
CREATE POLICY "Admins can view all payment status updates" ON public.payment_status_updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Ensure RLS is enabled on all tables
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_status_updates ENABLE ROW LEVEL SECURITY;
