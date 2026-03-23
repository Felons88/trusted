-- CLEAN UP DUPLICATE CLIENT RECORDS
-- This removes duplicate clients and keeps only the earliest created one for each user

-- Step 1: Identify duplicates
WITH ranked_clients AS (
  SELECT 
    id,
    user_id,
    email,
    full_name,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY 
        COALESCE(user_id, email::text) 
      ORDER BY created_at ASC
    ) as rn
  FROM clients
  WHERE user_id IS NOT NULL OR email IS NOT NULL
),
duplicates_to_delete AS (
  SELECT id, user_id, email, full_name, created_at
  FROM ranked_clients
  WHERE rn > 1
)

-- Step 2: Show what will be deleted (for verification)
SELECT 
  'DUPLICATES TO DELETE' as action,
  id,
  user_id,
  email,
  full_name,
  created_at
FROM duplicates_to_delete
ORDER BY email, created_at;

-- Step 3: Update any references to use the primary client record
UPDATE vehicles 
SET client_id = (
  SELECT c.id 
  FROM clients c 
  WHERE c.user_id = vehicles.client_id 
    OR c.email = (SELECT email FROM clients WHERE id = vehicles.client_id)
  ORDER BY c.created_at ASC 
  LIMIT 1
)
WHERE client_id IN (SELECT id FROM duplicates_to_delete);

UPDATE bookings 
SET client_id = (
  SELECT c.id 
  FROM clients c 
  WHERE c.user_id = bookings.client_id 
    OR c.email = (SELECT email FROM clients WHERE id = bookings.client_id)
  ORDER BY c.created_at ASC 
  LIMIT 1
)
WHERE client_id IN (SELECT id FROM duplicates_to_delete);

UPDATE invoices 
SET client_id = (
  SELECT c.id 
  FROM clients c 
  WHERE c.user_id = invoices.client_id 
    OR c.email = (SELECT email FROM clients WHERE id = invoices.client_id)
  ORDER BY c.created_at ASC 
  LIMIT 1
)
WHERE client_id IN (SELECT id FROM duplicates_to_delete);

UPDATE payments 
SET client_id = (
  SELECT c.id 
  FROM clients c 
  WHERE c.user_id = payments.client_id 
    OR c.email = (SELECT email FROM clients WHERE id = payments.client_id)
  ORDER BY c.created_at ASC 
  LIMIT 1
)
WHERE client_id IN (SELECT id FROM duplicates_to_delete);

-- Step 4: Delete the duplicate records
DELETE FROM clients 
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Step 5: Show the results
SELECT 
  'REMAINING CLIENTS' as action,
  COUNT(*) as count,
  ARRAY_AGG(DISTINCT email) as unique_emails
FROM clients;

-- Step 6: Show remaining clients by user
SELECT 
  user_id,
  email,
  full_name,
  created_at,
  'PRIMARY CLIENT' as status
FROM clients
ORDER BY email, created_at;

SELECT 'Client cleanup completed!' as result;
