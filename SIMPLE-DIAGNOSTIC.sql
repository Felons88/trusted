-- SIMPLE PAYMENTS DIAGNOSTIC SCRIPT
-- This script checks what's actually in your database

-- Check invoices table structure first
SELECT 'INVOICES TABLE COLUMNS' as info, 
       column_name,
       data_type
FROM information_schema.columns 
WHERE table_name = 'invoices' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if invoices table exists and has data
SELECT 'INVOICES TABLE CHECK' as info,
       COUNT(*) as total_invoices,
       COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices
FROM public.invoices;

-- Show sample invoices data
SELECT 'SAMPLE INVOICES DATA' as info, 
       id, invoice_number, client_id, booking_id, total_amount, status, created_at
FROM public.invoices 
WHERE status = 'paid'
LIMIT 5;

-- Check if payments table exists
SELECT 'PAYMENTS TABLE EXISTS' as info, 
       EXISTS (
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'payments' AND table_schema = 'public'
       ) as exists;

-- Show payments table columns if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'payments' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Payments table exists, showing columns...';
        
        -- Show payment table columns
        SELECT 'PAYMENTS TABLE COLUMNS' as info, 
               column_name,
               data_type
        FROM information_schema.columns 
        WHERE table_name = 'payments' AND table_schema = 'public'
        ORDER BY ordinal_position;
        
        -- Show payment count
        SELECT 'PAYMENTS COUNT' as info, COUNT(*) as count
        FROM public.payments;
        
        -- Show sample payments
        SELECT 'SAMPLE PAYMENTS' as info, *
        FROM public.payments 
        LIMIT 5;
    ELSE
        RAISE NOTICE 'Payments table does NOT exist';
    END IF;
END $$;

-- Check bookings table structure
SELECT 'BOOKINGS TABLE COLUMNS' as info, 
       column_name,
       data_type
FROM information_schema.columns 
WHERE table_name = 'bookings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check clients table structure  
SELECT 'CLIENTS TABLE COLUMNS' as info,
       column_name,
       data_type
FROM information_schema.columns 
WHERE table_name = 'clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Simple check: what tables exist in your database
SELECT 'ALL TABLES' as info, 
       table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
