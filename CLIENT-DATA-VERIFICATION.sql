-- CLIENT DATA VERIFICATION SCRIPT
-- This script helps verify that client data is properly linked and accessible

-- Step 1: Show current client duplication status
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
WHERE email IS NOT NULL;

-- Step 2: Show vehicles distribution across clients
SELECT 
    'Total vehicles' as metric,
    COUNT(*) as count
FROM vehicles
WHERE is_active = true

UNION ALL

SELECT 
    'Vehicles with valid client_id' as metric,
    COUNT(*) as count
FROM vehicles v
INNER JOIN clients c ON v.client_id = c.id
WHERE v.is_active = true

UNION ALL

SELECT 
    'Vehicles with orphaned client_id' as metric,
    COUNT(*) as count
FROM vehicles v
LEFT JOIN clients c ON v.client_id = c.id
WHERE v.is_active = true AND c.id IS NULL;

-- Step 3: Show bookings distribution across clients
SELECT 
    'Total bookings' as metric,
    COUNT(*) as count
FROM bookings

UNION ALL

SELECT 
    'Bookings with valid client_id' as metric,
    COUNT(*) as count
FROM bookings b
INNER JOIN clients c ON b.client_id = c.id

UNION ALL

SELECT 
    'Bookings with orphaned client_id' as metric,
    COUNT(*) as count
FROM bookings b
LEFT JOIN clients c ON b.client_id = c.id
WHERE c.id IS NULL;

-- Step 4: Show invoices distribution across clients
SELECT 
    'Total invoices' as metric,
    COUNT(*) as count
FROM invoices

UNION ALL

SELECT 
    'Invoices with valid client_id' as metric,
    COUNT(*) as count
FROM invoices i
INNER JOIN clients c ON i.client_id = c.id

UNION ALL

SELECT 
    'Invoices with orphaned client_id' as metric,
    COUNT(*) as count
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
WHERE c.id IS NULL;

-- Step 5: Show specific examples of clients with multiple records
SELECT 
    email,
    user_id,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ' ORDER BY created_at) as client_ids,
    STRING_AGG(created_at::text, ', ' ORDER BY created_at) as created_dates
FROM clients 
WHERE email IS NOT NULL OR user_id IS NOT NULL
GROUP BY email, user_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- Step 6: Show vehicles for a sample client with duplicates (if any)
WITH duplicate_clients AS (
    SELECT email, user_id, COUNT(*) as dup_count
    FROM clients 
    WHERE email IS NOT NULL OR user_id IS NOT NULL
    GROUP BY email, user_id
    HAVING COUNT(*) > 1
    LIMIT 1
)
SELECT 
    c.email,
    c.user_id,
    c.id as client_id,
    v.year,
    v.make,
    v.model,
    v.license_plate,
    v.is_active
FROM duplicate_clients dc
JOIN clients c ON (c.email = dc.email OR c.user_id = dc.user_id)
LEFT JOIN vehicles v ON v.client_id = c.id
ORDER BY c.created_at, v.created_at;

SELECT 'Client data verification completed!' as result;
