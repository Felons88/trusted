-- SIMPLE INVOICE COLUMN CHECK AND FIX
-- Check what columns exist in invoices and fix the code accordingly

-- First, check what columns actually exist in invoices table
SELECT 'INVOICES TABLE STRUCTURE' as info, 
       column_name,
       data_type
FROM information_schema.columns 
WHERE table_name = 'invoices' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample invoice data to see actual column names
SELECT 'SAMPLE INVOICE DATA' as info, *
FROM public.invoices 
LIMIT 3;

-- Create a simple payment view that works with whatever columns exist
-- This will be updated once we see the actual structure
