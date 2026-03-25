-- BOOKINGS TABLE USER_ID FIX
-- This script fixes the missing user_id column in the bookings table

-- First, let's check the current structure of the bookings table
DO $$
BEGIN
    RAISE NOTICE 'Checking bookings table structure...';
    
    -- Check if user_id column exists in bookings table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND table_schema = 'public' 
        AND column_name = 'user_id'
    ) THEN
        -- Add user_id column to bookings table
        ALTER TABLE public.bookings ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to bookings table';
        
        -- Create index for user_id
        CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
        RAISE NOTICE 'Created index for bookings.user_id';
    ELSE
        RAISE NOTICE 'user_id column already exists in bookings table';
    END IF;
    
    -- Check if client_id column exists (might be the correct column)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND table_schema = 'public' 
        AND column_name = 'client_id'
    ) THEN
        RAISE NOTICE 'client_id column exists in bookings table';
        
        -- If user_id is null but client_id exists, we can populate user_id from clients
        UPDATE public.bookings 
        SET user_id = (SELECT user_id FROM public.clients WHERE public.clients.id = public.bookings.client_id)
        WHERE user_id IS NULL AND client_id IS NOT NULL;
        
        RAISE NOTICE 'Populated user_id from client_id where possible';
    END IF;
    
END $$;

-- Update the payment policies to use the correct column references
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;

-- Create corrected policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (
        -- Check if user_id exists in bookings table
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'bookings' 
                AND table_schema = 'public' 
                AND column_name = 'user_id'
            ) THEN
                auth.uid() IN (
                    SELECT user_id FROM public.bookings WHERE id = booking_id
                )
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'bookings' 
                AND table_schema = 'public' 
                AND column_name = 'client_id'
            ) THEN
                auth.uid() IN (
                    SELECT user_id FROM public.clients WHERE id = (SELECT client_id FROM public.bookings WHERE public.bookings.id = public.payments.booking_id)
                )
            ELSE false
        END
    );

CREATE POLICY "Admins can manage all payments" ON public.payments
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Also check and fix the clients table to ensure user_id exists
DO $$
BEGIN
    -- Check if user_id column exists in clients table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND table_schema = 'public' 
        AND column_name = 'user_id'
    ) THEN
        -- Add user_id column to clients table
        ALTER TABLE public.clients ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to clients table';
        
        -- Create index for user_id
        CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
        RAISE NOTICE 'Created index for clients.user_id';
        
        -- Try to populate user_id from email (assuming email corresponds to auth.users.email)
        UPDATE public.clients 
        SET user_id = (SELECT id FROM auth.users WHERE auth.users.email = public.clients.email)
        WHERE user_id IS NULL AND email IS NOT NULL;
        
        RAISE NOTICE 'Attempted to populate user_id from email in clients table';
    ELSE
        RAISE NOTICE 'user_id column already exists in clients table';
    END IF;
    
END $$;

-- Update the record_payment_details function to handle cases where user_id might not exist
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
    v_user_id UUID;
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
    
    -- Check if booking exists and get user_id if available
    BEGIN
        SELECT 
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'bookings' 
                    AND table_schema = 'public' 
                    AND column_name = 'user_id'
                ) THEN user_id
                ELSE NULL
            END
        INTO v_user_id
        FROM public.bookings 
        WHERE id = v_booking_id;
        
        IF NOT FOUND THEN
            RETURN QUERY SELECT 
                false, NULL::UUID, 
                'Booking not found: ' || v_booking_id, 
                NULL;
            RETURN;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- If there's an error with user_id, try without it
            SELECT NULL INTO v_user_id;
    END;
    
    -- Generate new payment ID
    v_payment_id := gen_random_uuid();
    
    -- Insert payment record with correct column structure
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
    BEGIN
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
    EXCEPTION
        WHEN OTHERS THEN
        -- If payment_status column doesn't exist, just update status
        IF v_status IN ('succeeded', 'completed', 'paid') THEN
            UPDATE public.bookings 
            SET status = 'confirmed',
                updated_at = NOW()
            WHERE id = v_booking_id;
            
            v_booking_status := 'confirmed';
        ELSE
            v_booking_status := COALESCE((SELECT status FROM public.bookings WHERE id = v_booking_id), 'pending');
        END IF;
    END;
    
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

SELECT 'Bookings table user_id fix completed successfully!' as result;
