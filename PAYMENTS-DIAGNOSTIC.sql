-- PAYMENTS DIAGNOSTIC SCRIPT
-- This script checks what's in your database and helps debug the payments issue

-- Check if payments table exists and has data
SELECT 'PAYMENTS TABLE CHECK' as info, 
       COUNT(*) as payment_count
FROM public.payments;

-- Show payment table columns
SELECT 'PAYMENTS TABLE COLUMNS' as info, 
       column_name,
       data_type
FROM information_schema.columns 
WHERE table_name = 'payments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample payments data if exists
SELECT 'SAMPLE PAYMENTS DATA' as info, * 
FROM public.payments 
LIMIT 5;

-- Check invoices table
SELECT 'INVOICES TABLE CHECK' as info,
       COUNT(*) as total_invoices,
       COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
       COUNT(*) FILTER (WHERE payment_intent_id IS NOT NULL) as with_payment_intent
FROM public.invoices;

-- Show sample invoices data
SELECT 'SAMPLE INVOICES DATA' as info, 
       id, invoice_number, client_id, booking_id, total_amount, status, payment_intent_id,
       created_at
FROM public.invoices 
WHERE status = 'paid'
LIMIT 5;

-- Check if there are paid invoices without payment records
SELECT 'PAID INVOICES WITHOUT PAYMENTS' as info,
       COUNT(*) as missing_payments
FROM public.invoices i
LEFT JOIN public.payments p ON i.payment_intent_id = p.payment_intent_id
WHERE i.status = 'paid' 
AND (p.id IS NULL OR i.payment_intent_id IS NULL);

-- Show the specific missing payments
SELECT 'MISSING PAYMENT RECORDS' as info,
       i.id as invoice_id,
       i.invoice_number,
       i.client_id,
       i.booking_id,
       i.total_amount,
       i.payment_intent_id,
       i.status as invoice_status
FROM public.invoices i
LEFT JOIN public.payments p ON i.payment_intent_id = p.payment_intent_id
WHERE i.status = 'paid' 
AND p.id IS NULL
LIMIT 10;

-- Check bookings table structure
SELECT 'BOOKINGS TABLE STRUCTURE' as info,
       column_name,
       data_type
FROM information_schema.columns 
WHERE table_name = 'bookings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check clients table structure  
SELECT 'CLIENTS TABLE STRUCTURE' as info,
       column_name,
       data_type
FROM information_schema.columns 
WHERE table_name = 'clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test the sync function directly (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'sync_paid_invoices_to_payments' 
        AND routine_schema = 'public'
    ) THEN
        RAISE NOTICE 'sync_paid_invoices_to_payments function exists';
    ELSE
        RAISE NOTICE 'sync_paid_invoices_to_payments function does NOT exist';
    END IF;
END $$;

-- Create a simple test payment record if needed
DO $$
BEGIN
    -- Check if we have any paid invoices to test with
    IF EXISTS (SELECT 1 FROM public.invoices WHERE status = 'paid' AND payment_intent_id IS NOT NULL LIMIT 1) THEN
        RAISE NOTICE 'Found paid invoices with payment_intent_id - can create test payment';
    ELSE
        RAISE NOTICE 'No paid invoices with payment_intent_id found';
    END IF;
END $$;
