-- Simple version to add just the specific payment you were trying to access
-- This version is more likely to work since it doesn't depend on existing data

-- First, let's check what clients and bookings exist
-- Run these queries first to see what data you have:
-- SELECT id, full_name, email FROM clients LIMIT 3;
-- SELECT id, booking_number, client_id FROM bookings LIMIT 3;

-- Then replace the placeholder IDs with actual IDs from your database

INSERT INTO payments (
  id,
  booking_id, 
  client_id,
  stripe_payment_intent_id,
  amount,
  status,
  payment_method,
  created_at,
  updated_at,
  paid_at
) VALUES 
  -- This is the exact payment ID you were trying to access
  (
    'c167fec3-0c02-40f8-8e88-a2ae29c3d5bd',
    'PLACE_YOUR_BOOKING_ID_HERE',    -- Replace with actual booking UUID
    'PLACE_YOUR_CLIENT_ID_HERE',     -- Replace with actual client UUID
    'pi_test_1234567890',
    199.99,
    'paid',
    'card',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  );

-- If you need to find valid IDs, run these queries:
-- For clients: SELECT id, full_name FROM clients;
-- For bookings: SELECT id, booking_number, client_id FROM bookings;

-- After inserting, verify it worked:
SELECT * FROM payments WHERE id = 'c167fec3-0c02-40f8-8e88-a2ae29c3d5bd';
