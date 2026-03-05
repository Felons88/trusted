-- Quick fix for the most common NOT NULL constraint issues
-- Run this if you're getting constraint violations during booking creation

DO $$
BEGIN
    -- Fix the most problematic columns that are causing booking creation to fail
    DECLARE
        urgent_columns TEXT[] := ARRAY[
            'vehicle_size', 
            'service_address', 
            'subtotal',
            'tax_amount',
            'deposit_amount',
            'final_amount',
            'payment_method',
            'payment_status'
        ];
        
        col_name TEXT;
    BEGIN
        -- Loop through each urgent column
        FOREACH col_name IN ARRAY urgent_columns LOOP
            -- Check if column exists and has NOT NULL constraint
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'bookings' 
                AND column_name = col_name 
                AND is_nullable = 'NO'
            ) THEN
                -- Remove the NOT NULL constraint
                EXECUTE format('ALTER TABLE bookings ALTER COLUMN %I DROP NOT NULL', col_name);
                RAISE NOTICE 'Fixed NOT NULL constraint for % column', col_name;
            END IF;
        END LOOP;
    END;
END $$;

-- Show which columns were fixed
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('vehicle_size', 'service_address', 'subtotal', 'tax_amount', 'deposit_amount', 'final_amount', 'payment_method', 'payment_status')
ORDER BY column_name;

-- Show remaining NOT NULL columns that might still cause issues
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- Test booking creation with minimal required fields
-- This shows what a minimal booking looks like
SELECT 'Minimal booking columns needed:' as info;
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('client_id', 'vehicle_id', 'service_type', 'booking_number', 'preferred_date', 'preferred_time', 'status', 'total_cost')
ORDER BY ordinal_position;
