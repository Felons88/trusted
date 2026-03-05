-- Quick fix for James Hewitt's vehicle
-- This will assign the most recent unassigned vehicle to James

UPDATE vehicles 
SET client_id = 'd5ea481d-e040-46f8-8c5b-55e627f67da1',
    is_active = true
WHERE client_id IS NULL OR client_id = '' OR client_id NOT IN (SELECT id FROM clients)
ORDER BY created_at DESC 
LIMIT 1;

-- Verify the fix
SELECT 
    v.make,
    v.model,
    v.year,
    v.color,
    c.full_name,
    c.email
FROM vehicles v
JOIN clients c ON v.client_id = c.id
WHERE c.user_id = '5534d6da-3d83-4a9a-88d7-556c9528f2d2';
