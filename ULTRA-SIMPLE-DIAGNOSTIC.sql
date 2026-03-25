-- ULTRA SIMPLE DIAGNOSTIC
-- Just check what exists without assumptions

-- 1. What tables do you have?
SELECT 'ALL TABLES IN DATABASE' as info, 
       table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. What columns exist in invoices table?
SELECT 'INVOICES TABLE COLUMNS' as info, 
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoices' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Show all data from invoices (limit 5)
SELECT 'SAMPLE INVOICES DATA' as info, *
FROM public.invoices 
LIMIT 5;

-- 4. What columns exist in payments table (if it exists)?
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'payments' AND table_schema = 'public'
    ) THEN
        SELECT 'PAYMENTS TABLE COLUMNS' as info, 
               column_name,
               data_type,
               is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'payments' AND table_schema = 'public'
        ORDER BY ordinal_position;
        
        SELECT 'SAMPLE PAYMENTS DATA' as info, *
        FROM public.payments 
        LIMIT 5;
    ELSE
        SELECT 'PAYMENTS TABLE' as info, 'DOES NOT EXIST' as status;
    END IF;
END $$;
