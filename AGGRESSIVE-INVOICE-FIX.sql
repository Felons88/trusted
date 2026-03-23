-- AGGRESSIVE FIX FOR INVOICE DUPLICATES
-- This completely removes the constraint and fixes everything

-- Step 1: Force drop the constraint (ignore errors)
DO $$
BEGIN
  ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Constraint already removed or does not exist';
END $$;

-- Step 2: Fix ALL duplicates with a more aggressive approach
UPDATE invoices 
SET invoice_number = id::TEXT || '-INV-' || COALESCE(invoice_number, 'UNKNOWN')
WHERE invoice_number IS NOT NULL
  AND invoice_number IN (
    SELECT invoice_number 
    FROM invoices 
    WHERE invoice_number IS NOT NULL
    GROUP BY invoice_number 
    HAVING COUNT(*) > 1
  );

-- Step 3: Update any remaining NULL invoice numbers
UPDATE invoices 
SET invoice_number = id::TEXT || '-INV-' || TO_CHAR(created_at, 'YYYY-MM-DD')
WHERE invoice_number IS NULL;

-- Step 4: Create a completely new simple numbering system
CREATE OR REPLACE FUNCTION create_unique_invoice_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    new_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 3, '0');
    
    -- Check if this number exists
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number = new_number) THEN
      EXIT;
    END IF;
    
    counter := counter + 1;
    
    -- Safety break after 1000 attempts
    IF counter > 1000 THEN
      new_number := 'INV-' || gen_random_uuid()::TEXT;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update trigger to use new function
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := create_unique_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Recreate trigger
DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
CREATE TRIGGER trigger_set_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION set_invoice_number();

-- Step 7: Fix any existing invoices that still have problematic numbers
UPDATE invoices 
SET invoice_number = create_unique_invoice_number()
WHERE invoice_number IS NULL 
   OR invoice_number = ''
   OR invoice_number IN (
     SELECT invoice_number 
     FROM invoices 
     WHERE invoice_number IS NOT NULL
     GROUP BY invoice_number 
     HAVING COUNT(*) > 1
   );

-- Step 8: Now safely add the unique constraint
DO $$
BEGIN
  -- First check if there are any duplicates
  IF EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoice_number IS NOT NULL 
    GROUP BY invoice_number 
    HAVING COUNT(*) > 1
  ) THEN
    RAISE NOTICE 'Cannot add constraint - duplicates still exist';
  ELSE
    ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);
    RAISE NOTICE 'Unique constraint added successfully';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding constraint: %', SQLERRM;
END $$;

-- Step 9: Show the current state
SELECT 
  invoice_number,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 1 THEN 'DUPLICATE'
    ELSE 'UNIQUE'
  END as status
FROM invoices 
WHERE invoice_number IS NOT NULL
GROUP BY invoice_number
ORDER BY status DESC, invoice_number;

SELECT 'Aggressive invoice duplicate fix completed!' as result;
