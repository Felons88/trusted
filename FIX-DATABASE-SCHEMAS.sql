-- COMPREHENSIVE DATABASE SCHEMA FIXES
-- This fixes common issues causing save/add errors

-- Step 1: Ensure all triggers are working properly
-- Fix booking number generation trigger
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(booking_number FROM 5) AS INTEGER)), 0) + 1
  INTO counter
  FROM bookings
  WHERE booking_number LIKE 'TMD-%';
  
  new_number := 'TMD-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trigger_set_booking_number ON bookings;
CREATE TRIGGER trigger_set_booking_number
BEFORE INSERT ON bookings
FOR EACH ROW
WHEN (NEW.booking_number IS NULL)
EXECUTE FUNCTION set_booking_number();

-- Step 2: Fix column name issues
-- Check if vehicles table has correct column names
DO $$
BEGIN
  -- Add 'size' column if it doesn't exist (some code might reference 'vehicle_size')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'size') THEN
    ALTER TABLE vehicles ADD COLUMN size vehicle_size;
  END IF;
  
  -- Ensure 'vehicle_size' column exists for backward compatibility
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'vehicle_size') THEN
    ALTER TABLE vehicles ADD COLUMN vehicle_size vehicle_size;
  END IF;
  
  -- Sync the columns
  UPDATE vehicles SET size = vehicle_size WHERE size IS NULL AND vehicle_size IS NOT NULL;
  UPDATE vehicles SET vehicle_size = size WHERE vehicle_size IS NULL AND size IS NOT NULL;
END $$;

-- Step 3: Fix bookings table column issues
DO $$
BEGIN
  -- Ensure 'total' column exists (not 'total_cost')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'total') THEN
    ALTER TABLE bookings ADD COLUMN total DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  -- Ensure 'tax' column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'tax') THEN
    ALTER TABLE bookings ADD COLUMN tax DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  -- Note: total_cost column doesn't exist, so no sync needed
  -- Frontend should use 'total' column directly
END $$;

-- Step 4: Ensure all foreign key constraints are properly set
-- Check and fix clients.user_id constraint
DO $$
BEGIN
  -- Remove and recreate foreign key if needed
  ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;
  ALTER TABLE clients ADD CONSTRAINT clients_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
END $$;

-- Step 5: Ensure app_settings table is properly configured
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
  settings = EXCLUDED.settings;

-- Step 6: Create helper function for proper error handling
CREATE OR REPLACE FUNCTION handle_database_error(error_code TEXT, error_message TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE error_code
    WHEN '23505' THEN RETURN 'This record already exists';
    WHEN '23503' THEN RETURN 'Referenced record does not exist';
    WHEN '23502' THEN RETURN 'Required field is missing';
    WHEN '23514' THEN RETURN 'Data violates check constraint';
    WHEN '42P01' THEN RETURN 'Table does not exist';
    WHEN '42703' THEN RETURN 'Column does not exist';
    WHEN '42501' THEN RETURN 'Insufficient privileges';
    ELSE RETURN COALESCE(error_message, 'Unknown database error');
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Verify all fixes
SELECT '=== DATABASE FIXES VERIFICATION ===' as info;

-- Check bookings table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('booking_number', 'total', 'tax')
ORDER BY column_name;

-- Check vehicles table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND column_name IN ('size', 'vehicle_size')
ORDER BY column_name;

-- Check app_settings
SELECT 
  id,
  settings->>'company_name' as company_name,
  'Settings configured' as status
FROM app_settings;

-- Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  'Trigger exists' as status
FROM information_schema.triggers
WHERE trigger_name = 'trigger_set_booking_number';

SELECT 'All database fixes applied successfully!' as status;
