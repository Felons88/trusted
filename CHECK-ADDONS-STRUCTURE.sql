-- CHECK ADD_ONS TABLE STRUCTURE
-- This script checks the current structure of the add_ons table

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'add_ons' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing add-ons data
SELECT 'EXISTING ADD-ONS DATA' as info, * FROM add_ons LIMIT 5;

-- Check if vehicle size pricing columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'add_ons' 
AND table_schema = 'public'
AND column_name LIKE '%price%';
