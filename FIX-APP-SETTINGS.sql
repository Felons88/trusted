-- QUICK FIX FOR APP_SETTINGS TABLE STRUCTURE

-- First, check what columns app_settings actually has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_settings' 
ORDER BY ordinal_position;

-- If the table doesn't exist or has wrong structure, recreate it
DROP TABLE IF EXISTS app_settings CASCADE;

CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the settings with correct column name
INSERT INTO app_settings (id, settings)
VALUES (1, '{
  "company_name": "Trusted Mobile Detailing",
  "company_email": "info@trustedmobiledetailing.com",
  "company_phone": "+1-555-0123",
  "booking_deposit_required": true,
  "booking_deposit_amount": 50.00,
  "tax_rate": 0.08,
  "currency": "USD",
  "timezone": "America/New_York"
}'::JSONB)
ON CONFLICT (id) DO UPDATE SET 
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Grant permissions
GRANT ALL ON app_settings TO authenticated;
GRANT ALL ON app_settings TO anon;

-- Verify the fix
SELECT '=== APP_SETTINGS FIXED ===' as info;
SELECT id, settings->>'company_name' as company_name FROM app_settings;
