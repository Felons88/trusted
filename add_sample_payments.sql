-- Add sample payments for testing the receipt system
-- This will create sample payments that can be used to test the receipt functionality

-- First, let's check if we have existing clients and bookings to associate payments with
-- You can run this to see what data exists:
-- SELECT id, full_name, email FROM clients LIMIT 5;
-- SELECT id, booking_number, client_id, total FROM bookings LIMIT 5;

-- Insert sample payments (replace with actual client_id and booking_id from your database)
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
  -- Sample Payment 1 (Paid) - This is the one you were trying to access
  (
    'c167fec3-0c02-40f8-8e88-a2ae29c3d5bd',
    (SELECT id FROM bookings ORDER BY created_at DESC LIMIT 1),  -- Use most recent booking
    (SELECT id FROM clients ORDER BY created_at DESC LIMIT 1),   -- Use most recent client
    'pi_test_1234567890',
    199.99,
    'paid',
    'card',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  
  -- Sample Payment 2 (Paid)
  (
    'd278fed4-1d13-41f9-9f99-b3bf30a4e6ce',
    (SELECT id FROM bookings ORDER BY created_at DESC LIMIT 1 OFFSET 1),  -- Second most recent
    (SELECT id FROM clients ORDER BY created_at DESC LIMIT 1),
    'pi_test_1234567891',
    149.99,
    'paid',
    'card',
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '1 week'
  ),
  
  -- Sample Payment 3 (Pending) - Fixed UUID
  (
    'e389gfe5-2e24-42f0-0faa-c4cg41bf5d7df',
    (SELECT id FROM bookings ORDER BY created_at DESC LIMIT 1 OFFSET 2),  -- Third most recent
    (SELECT id FROM clients ORDER BY created_at DESC LIMIT 1),
    'pi_test_1234567892',
    99.99,
    'pending',
    'card',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    NULL
  );

-- Update client total_spent based on paid payments
UPDATE clients 
SET total_spent = (
  SELECT COALESCE(SUM(amount), 0) 
  FROM payments 
  WHERE payments.client_id = clients.id AND payments.status = 'paid'
);

-- Update client total_bookings based on bookings
UPDATE clients 
SET total_bookings = (
  SELECT COUNT(*) 
  FROM bookings 
  WHERE bookings.client_id = clients.id
);

-- Verify the data was inserted
SELECT 
  p.id,
  p.amount,
  p.status,
  p.payment_method,
  p.created_at,
  p.paid_at,
  c.full_name as client_name,
  b.booking_number
FROM payments p
LEFT JOIN clients c ON p.client_id = c.id  
LEFT JOIN bookings b ON p.booking_id = b.id
ORDER BY p.created_at DESC;
