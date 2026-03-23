-- CLIENT DUPLICATION ANALYSIS
-- This script shows the current state of client duplicates

-- Show total clients vs unique clients
SELECT 
    'Total client records' as metric,
    COUNT(*) as count
FROM clients

UNION ALL

SELECT 
    'Unique by user_id' as metric,
    COUNT(DISTINCT user_id) as count
FROM clients 
WHERE user_id IS NOT NULL

UNION ALL

SELECT 
    'Unique by email' as metric,
    COUNT(DISTINCT email) as count
FROM clients 
WHERE email IS NOT NULL

UNION ALL

SELECT 
    'Potential duplicates (same email)' as metric,
    COUNT(*) - COUNT(DISTINCT email) as count
FROM clients 
WHERE email IS NOT NULL

UNION ALL

SELECT 
    'Potential duplicates (same user_id)' as metric,
    COUNT(*) - COUNT(DISTINCT user_id) as count
FROM clients 
WHERE user_id IS NOT NULL;

-- Show specific duplicates by email
SELECT 
    email,
    COUNT(*) as duplicate_count,
    STRING_AGG(full_name || ' (' || id || ')', ', ' ORDER BY created_at) as duplicate_records
FROM clients 
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, email;

-- Show specific duplicates by user_id
SELECT 
    user_id,
    COUNT(*) as duplicate_count,
    STRING_AGG(full_name || ' (' || id || ')', ', ' ORDER BY created_at) as duplicate_records
FROM clients 
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, user_id;

-- Recommendation: Run CLEANUP-DUPLICATE-CLIENTS.sql to remove duplicates permanently
