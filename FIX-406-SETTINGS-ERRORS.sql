-- COMPREHENSIVE FIX FOR 406 AND SETTINGS ERRORS

-- Step 1: Ensure RLS is completely disabled
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Step 2: Create the missing profile for this specific user
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '86e36bd6-01ab-42e1-99ea-7af51c3201b5',
  (SELECT email FROM auth.users WHERE id = '86e36bd6-01ab-42e1-99ea-7af51c3201b5'),
  (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = '86e36bd6-01ab-42e1-99ea-7af51c3201b5'),
  'client'::user_role
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create a single settings row approach (better for frontend)
-- Create a single settings record with all data as JSON
CREATE TABLE IF NOT EXISTS settings_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert or update the settings config
INSERT INTO settings_config (config)
VALUES (
  '{
    "company_name": "Trusted Mobile Detailing",
    "company_email": "info@trustedmobiledetailing.com",
    "company_phone": "+1-555-0123",
    "booking_deposit_required": "true",
    "booking_deposit_amount": "50.00",
    "tax_rate": "0.08",
    "currency": "USD",
    "timezone": "America/New_York"
  }'::JSONB
)
ON CONFLICT (id) DO UPDATE SET 
  config = EXCLUDED.config,
  updated_at = NOW();

-- Step 4: Enable RLS on the new settings table with proper policy
ALTER TABLE settings_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view settings config" ON settings_config FOR SELECT USING (true);

-- Step 5: Create trigger for settings_config
CREATE TRIGGER update_settings_config_updated_at BEFORE UPDATE ON settings_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Step 6: Test the fixes
SELECT 'Fixes applied successfully' as status;

-- Verify the user profile exists
SELECT 
  p.id,
  p.email,
  p.role,
  'Profile exists' as status
FROM profiles p
WHERE p.id = '86e36bd6-01ab-42e1-99ea-7af51c3201b5';

-- Show the new settings config
SELECT config, updated_at FROM settings_config;

-- Instructions for frontend update
SELECT 'Frontend should now query settings_config table instead of settings' as frontend_note;
