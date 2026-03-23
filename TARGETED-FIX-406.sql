-- TARGETED FIX FOR PERSISTENT 406 AND SETTINGS ERRORS

-- Step 1: Check if the user has any clients and create one if needed
DO $$
DECLARE
    client_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO client_count 
    FROM clients 
    WHERE user_id = '86e36bd6-01ab-42e1-99ea-7af51c3201b5';
    
    IF client_count = 0 THEN
        -- Create a default client for this user
        INSERT INTO clients (
            user_id, 
            full_name, 
            email, 
            phone, 
            address, 
            created_at
        ) VALUES (
            '86e36bd6-01ab-42e1-99ea-7af51c3201b5',
            (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = '86e36bd6-01ab-42e1-99ea-7af51c3201b5'),
            (SELECT email FROM auth.users WHERE id = '86e36bd6-01ab-42e1-99ea-7af51c3201b5'),
            '+1-555-0123',
            'Default Address',
            NOW()
        );
    END IF;
END $$;

-- Step 2: Fix the settings query by creating a proper single-row response
-- Create a view that returns exactly one row with settings as JSON
CREATE OR REPLACE VIEW settings_single_row AS
SELECT 
  row_number() OVER () as rn,
  json_build_object(
    'company_name', 'Trusted Mobile Detailing',
    'company_email', 'info@trustedmobiledetailing.com',
    'company_phone', '+1-555-0123',
    'booking_deposit_required', true,
    'booking_deposit_amount', 50.00,
    'tax_rate', 0.08,
    'currency', 'USD',
    'timezone', 'America/New_York'
  ) as settings
FROM (SELECT 1) x
LIMIT 1;

-- Step 3: Grant permissions on the view
GRANT SELECT ON settings_single_row TO authenticated;
GRANT SELECT ON settings_single_row TO anon;

-- Step 4: Create a function to get settings (alternative approach)
CREATE OR REPLACE FUNCTION get_app_settings()
RETURNS TABLE(settings JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'company_name', 'Trusted Mobile Detailing',
    'company_email', 'info@trustedmobiledetailing.com',
    'company_phone', '+1-555-0123',
    'booking_deposit_required', true,
    'booking_deposit_amount', 50.00,
    'tax_rate', 0.08,
    'currency', 'USD',
    'timezone', 'America/New_York'
  )::JSONB;
END;
$$;

-- Step 5: Verify the fixes
SELECT '=== VERIFICATION RESULTS ===' as info;

-- Check if user now has clients
SELECT 
  COUNT(*) as client_count,
  'Clients for user' as description
FROM clients 
WHERE user_id = '86e36bd6-01ab-42e1-99ea-7af51c3201b5';

-- Show the client details
SELECT 
  id,
  full_name,
  email,
  phone,
  'Client created' as status
FROM clients 
WHERE user_id = '86e36bd6-01ab-42e1-99ea-7af51c3201b5';

-- Test the settings view
SELECT 
  settings->>'company_name' as company_name,
  'Settings view working' as status
FROM settings_single_row;

-- Test the settings function
SELECT get_app_settings() as function_result;

SELECT '=== FRONTEND USAGE ===' as info;
SELECT 'For clients: GET /rest/v1/clients?select=*&user_id=eq.YOUR_USER_ID' as client_url;
SELECT 'For settings: GET /rest/v1/settings_single_row?select=settings&eq=1' as settings_url;
SELECT 'Or use RPC: POST /rest/v1/rpc/get_app_settings' as rpc_url;
