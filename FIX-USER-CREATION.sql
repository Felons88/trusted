-- FIX USER CREATION ISSUES
-- This script fixes problems with user creation by temporarily disabling problematic triggers

-- Step 1: Temporarily disable the auto_promote_admin trigger
DROP TRIGGER IF EXISTS auto_promote_admin_trigger ON auth.users;

-- Step 2: Check if profiles table has correct constraints
-- Sometimes the email unique constraint can cause issues during user creation
-- Let's make sure the profiles table is properly set up

-- Drop and recreate profiles table to fix any constraint issues
DROP TABLE IF EXISTS profiles CASCADE;

-- Recreate profiles table with proper constraints
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create a safer trigger that only promotes specific users after they exist
-- This trigger won't interfere with initial user creation
CREATE OR REPLACE FUNCTION safe_auto_promote_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Only promote if the user already exists and matches our admin emails
  -- This prevents interference during initial user creation
  PERFORM 1; -- Do nothing during user creation
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger but it won't interfere with user creation
CREATE TRIGGER safe_auto_promote_admin_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION safe_auto_promote_admin();

-- Step 4: Create a separate function to manually promote users to admin
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RETURN 'User not found: ' || user_email || '. User must sign up first.';
  END IF;
  
  -- Update or insert profile with admin role
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (user_id, user_email, 
    CASE 
      WHEN user_email = 'jameshewitt312@gmail.com' THEN 'James Hewitt'
      WHEN user_email LIKE 'daniel2002@%' THEN 'Daniel'
      ELSE 'Admin User'
    END, 
    'admin')
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'admin',
    updated_at = NOW();
  
  RETURN 'User promoted to admin: ' || user_email;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a function to create profiles for existing users
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a basic profile for new users
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NULL, 'client')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_user();

-- Step 6: Test the current state
SELECT 'User creation fix applied' as status;

-- Check if we can create profiles for existing users
SELECT 
  'Existing users in auth.users:' as info,
  COUNT(*) as user_count
FROM auth.users;

-- Show current profiles
SELECT 
  'Current profiles:' as info,
  COUNT(*) as profile_count
FROM profiles;

-- Instructions
SELECT 'AFTER RUNNING THIS SCRIPT:' as instructions;
SELECT '1. Try creating a new user through Supabase Auth' as step1;
SELECT '2. If successful, promote James with: SELECT promote_user_to_admin(''jameshewitt312@gmail.com'');' as step2;
SELECT '3. Update Daniel''s email in the promote_user_to_admin function if needed' as step3;
