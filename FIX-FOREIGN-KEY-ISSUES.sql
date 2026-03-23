-- FIX FOREIGN KEY AND SETTINGS ISSUES

-- Step 1: Create missing profiles for existing auth.users
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  CASE 
    WHEN email = 'jameshewitt312@gmail.com' THEN 'admin'::user_role
    WHEN email LIKE 'daniel2002@%' THEN 'admin'::user_role
    ELSE 'client'::user_role
  END as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Fix the settings query issue
-- The error suggests the frontend expects a single object but gets multiple rows
-- Let's create a function to return settings as a JSON object

CREATE OR REPLACE FUNCTION get_settings()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB := '{}'::JSONB;
  setting_record RECORD;
BEGIN
  FOR setting_record IN 
    SELECT key, value FROM settings
  LOOP
    result := result || jsonb_build_object(setting_record.key, setting_record.value);
  END LOOP;
  
  RETURN result;
END;
$$;

-- Step 3: Create a single-row view for settings (alternative approach)
CREATE OR REPLACE VIEW settings_single AS
SELECT 
  jsonb_object_agg(key, value) as settings_data
FROM settings;

-- Step 4: Verify the fixes
SELECT 'Profiles created for existing users' as status;

-- Show created profiles
SELECT 
  p.id,
  p.email,
  p.role,
  p.created_at,
  'Created from auth.users' as source
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.created_at > NOW() - INTERVAL '1 hour'
ORDER BY p.created_at DESC;

-- Show settings as JSON object
SELECT get_settings() as all_settings_json;

-- Show settings single view
SELECT * FROM settings_single;
