-- SQL to confirm email for user IsaiahDellwo01@gmail.com
-- This script updates the user's profile to mark email as confirmed

-- First, let's check if the user exists
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.email = 'IsaiahDellwo01@gmail.com';

-- Update the user's email confirmation status in Supabase auth.users
-- This marks the email as confirmed at the current time
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE id IN (
  SELECT id FROM profiles WHERE email = 'IsaiahDellwo01@gmail.com'
);

-- Verify the update was successful
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  au.email_confirmed_at,
  au.last_sign_in_at,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN 'Email Confirmed ✓'
    ELSE 'Email Not Confirmed ✗'
  END as confirmation_status
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.email = 'IsaiahDellwo01@gmail.com';

-- Optional: Also update any related client records if they exist
UPDATE clients 
SET email = 'IsaiahDellwo01@gmail.com'
WHERE user_id IN (
  SELECT id FROM profiles WHERE email = 'IsaiahDellwo01@gmail.com'
);

-- Show final status of all related records
SELECT 
  'Profile' as record_type,
  p.email,
  p.full_name,
  p.role,
  au.email_confirmed_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.email = 'IsaiahDellwo01@gmail.com'

UNION ALL

SELECT 
  'Client' as record_type,
  c.email,
  c.full_name,
  'client' as role,
  NULL as email_confirmed_at
FROM clients c
WHERE c.email = 'IsaiahDellwo01@gmail.com';
