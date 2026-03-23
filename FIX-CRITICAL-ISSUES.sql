-- FIX CRITICAL ISSUES - Missing settings table and RLS recursion

-- Step 1: Create the missing settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('company_name', 'Trusted Mobile Detailing', 'Company name for branding'),
  ('company_email', 'info@trustedmobiledetailing.com', 'Main contact email'),
  ('company_phone', '+1-555-0123', 'Main contact phone'),
  ('booking_deposit_required', 'true', 'Whether deposit is required for bookings'),
  ('booking_deposit_amount', '50.00', 'Default deposit amount'),
  ('tax_rate', '0.08', 'Tax rate for calculations'),
  ('currency', 'USD', 'Default currency'),
  ('timezone', 'America/New_York', 'Default timezone')
ON CONFLICT (key) DO NOTHING;

-- Step 2: Fix the infinite recursion in profiles RLS policy
-- The issue is that the admin check policy references itself
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create a corrected admin policy that doesn't cause recursion
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Step 3: Enable RLS on settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for settings (admin only)
CREATE POLICY "Admins can manage settings" ON settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Anyone can view basic settings" ON settings FOR SELECT USING (
  key IN ('company_name', 'company_email', 'company_phone')
);

-- Step 5: Create trigger for settings updated_at
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Step 6: Verify the fix
SELECT 'Settings table created and RLS policies fixed' as status;

-- Show current settings
SELECT key, value, description FROM settings ORDER BY key;
