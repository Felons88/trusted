-- PAYMENT RECORDING FUNCTION
-- This script creates the missing record_payment_details RPC function

-- Create record_payment_details function if it doesn't exist
CREATE OR REPLACE FUNCTION public.record_payment_details(
    p_booking_id UUID,
    p_payment_intent_id TEXT,
    p_amount DECIMAL,
    p_status TEXT DEFAULT 'pending',
    p_payment_method TEXT DEFAULT 'card',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    success BOOLEAN,
    payment_id UUID,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_id UUID;
    v_booking_status TEXT;
BEGIN
    -- Validate inputs
    IF p_booking_id IS NULL OR p_payment_intent_id IS NULL OR p_amount IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Missing required parameters: booking_id, payment_intent_id, and amount are required';
        RETURN;
    END IF;
    
    -- Check if booking exists
    IF NOT EXISTS (SELECT 1 FROM public.bookings WHERE id = p_booking_id) THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Booking not found';
        RETURN;
    END IF;
    
    -- Generate new payment ID
    v_payment_id := gen_random_uuid();
    
    -- Insert payment record
    INSERT INTO public.payments (
        id,
        booking_id,
        payment_intent_id,
        amount,
        status,
        payment_method,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        v_payment_id,
        p_booking_id,
        p_payment_intent_id,
        p_amount,
        p_status,
        p_payment_method,
        p_metadata,
        NOW(),
        NOW()
    );
    
    -- Update booking status if payment is successful
    IF p_status = 'succeeded' OR p_status = 'completed' THEN
        UPDATE public.bookings 
        SET status = 'confirmed', 
            payment_status = 'paid',
            updated_at = NOW()
        WHERE id = p_booking_id;
        
        v_booking_status := 'confirmed';
    ELSE
        UPDATE public.bookings 
        SET payment_status = p_status,
            updated_at = NOW()
        WHERE id = p_booking_id;
        
        v_booking_status := COALESCE((SELECT status FROM public.bookings WHERE id = p_booking_id), 'pending');
    END IF;
    
    -- Return success response
    RETURN QUERY SELECT 
        true as success, 
        v_payment_id as payment_id, 
        'Payment recorded successfully. Booking status: ' || v_booking_status as message;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false as success, 
            NULL::UUID as payment_id, 
            'Error recording payment: ' || SQLERRM as message;
END;
$$;

-- Universal payment recording function that accepts any JSON structure
CREATE OR REPLACE FUNCTION public.record_payment_details(input_data JSONB)
RETURNS TABLE (
    success BOOLEAN,
    payment_id UUID,
    message TEXT,
    booking_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking_id UUID;
    v_payment_intent_id TEXT;
    v_amount DECIMAL;
    v_status TEXT;
    v_payment_method TEXT;
    v_metadata JSONB;
    v_payment_id UUID;
    v_booking_status TEXT;
    v_keys TEXT[];
BEGIN
    -- Log the input for debugging
    RAISE LOG 'record_payment_details called with: %', input_data;
    
    -- Extract parameters with flexible key matching
    v_booking_id := COALESCE(
        (input_data ->> 'booking_id')::UUID,
        (input_data ->> 'bookingId')::UUID,
        (input_data ->> 'bookingID')::UUID
    );
    
    v_payment_intent_id := COALESCE(
        input_data ->> 'payment_intent_id',
        input_data ->> 'paymentIntentId',
        input_data ->> 'payment_intent',
        input_data ->> 'stripe_payment_intent_id',
        input_data ->> 'intent_id'
    );
    
    v_amount := COALESCE(
        (input_data ->> 'amount')::DECIMAL,
        (input_data ->> 'payment_amount')::DECIMAL,
        (input_data ->> 'total')::DECIMAL,
        (input_data ->> 'value')::DECIMAL
    );
    
    v_status := COALESCE(
        input_data ->> 'status',
        input_data ->> 'payment_status',
        'pending'
    );
    
    v_payment_method := COALESCE(
        input_data ->> 'payment_method',
        input_data ->> 'method',
        input_data ->> 'type',
        'card'
    );
    
    v_metadata := COALESCE(input_data -> 'metadata', input_data, '{}'::jsonb);
    
    -- Get all keys for debugging
    SELECT ARRAY_AGG(key) INTO v_keys FROM jsonb_object_keys(input_data);
    RAISE LOG 'Available keys: %', v_keys;
    
    -- Validate inputs
    IF v_booking_id IS NULL THEN
        RETURN QUERY SELECT 
            false, NULL::UUID, 
            'Missing or invalid booking_id. Available keys: ' || array_to_string(v_keys, ', '), 
            NULL;
        RETURN;
    END IF;
    
    IF v_payment_intent_id IS NULL THEN
        RETURN QUERY SELECT 
            false, NULL::UUID, 
            'Missing payment_intent_id. Available keys: ' || array_to_string(v_keys, ', '), 
            NULL;
        RETURN;
    END IF;
    
    IF v_amount IS NULL OR v_amount <= 0 THEN
        RETURN QUERY SELECT 
            false, NULL::UUID, 
            'Missing or invalid amount. Available keys: ' || array_to_string(v_keys, ', '), 
            NULL;
        RETURN;
    END IF;
    
    -- Check if booking exists
    IF NOT EXISTS (SELECT 1 FROM public.bookings WHERE id = v_booking_id) THEN
        RETURN QUERY SELECT 
            false, NULL::UUID, 
            'Booking not found: ' || v_booking_id, 
            NULL;
        RETURN;
    END IF;
    
    -- Generate new payment ID
    v_payment_id := gen_random_uuid();
    
    -- Insert payment record
    INSERT INTO public.payments (
        id,
        booking_id,
        payment_intent_id,
        amount,
        status,
        payment_method,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        v_payment_id,
        v_booking_id,
        v_payment_intent_id,
        v_amount,
        v_status,
        v_payment_method,
        v_metadata,
        NOW(),
        NOW()
    );
    
    -- Update booking status if payment is successful
    IF v_status IN ('succeeded', 'completed', 'paid') THEN
        UPDATE public.bookings 
        SET status = 'confirmed', 
            payment_status = 'paid',
            updated_at = NOW()
        WHERE id = v_booking_id;
        
        v_booking_status := 'confirmed';
    ELSE
        UPDATE public.bookings 
        SET payment_status = v_status,
            updated_at = NOW()
        WHERE id = v_booking_id;
        
        v_booking_status := COALESCE((SELECT status FROM public.bookings WHERE id = v_booking_id), 'pending');
    END IF;
    
    -- Return success response
    RETURN QUERY SELECT 
        true as success, 
        v_payment_id as payment_id, 
        'Payment recorded successfully' as message,
        v_booking_status as booking_status;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in record_payment_details: %', SQLERRM;
        RETURN QUERY SELECT 
            false as success, 
            NULL::UUID as payment_id, 
            'Error recording payment: ' || SQLERRM as message,
            NULL as booking_status;
END;
$$;

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    payment_intent_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'completed', 'failed', 'cancelled')),
    payment_method TEXT DEFAULT 'card',
    metadata JSONB DEFAULT '{}'::jsonb,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_intent_id ON public.payments(payment_intent_id);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.bookings WHERE id = booking_id
        )
    );

CREATE POLICY "Admins can manage all payments" ON public.payments
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

SELECT 'Payment recording function and table setup completed successfully!' as result;
