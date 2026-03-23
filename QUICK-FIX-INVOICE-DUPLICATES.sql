-- QUICK FIX FOR DUPLICATE INVOICE NUMBERS
-- This directly handles the duplicate issue

-- Step 1: Temporarily disable the unique constraint
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;

-- Step 2: Fix existing duplicates by adding suffixes
WITH duplicates AS (
  SELECT 
    id,
    invoice_number,
    ROW_NUMBER() OVER (PARTITION BY invoice_number ORDER BY created_at) as rn
  FROM invoices 
  WHERE invoice_number IS NOT NULL
),
to_update AS (
  SELECT id, invoice_number, rn
  FROM duplicates 
  WHERE rn > 1
)
UPDATE invoices 
SET invoice_number = to_update.invoice_number || '-' || to_update.rn::TEXT
FROM to_update 
WHERE invoices.id = to_update.id;

-- Step 3: Create a simpler invoice number function
CREATE OR REPLACE FUNCTION generate_simple_invoice_number()
RETURNS TEXT AS $$
DECLARE
  max_counter INTEGER;
  new_number TEXT;
BEGIN
  -- Get the highest counter from existing invoices
  SELECT COALESCE(MAX(CASE 
    WHEN invoice_number ~ '^INV-\d+$' THEN CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)
    WHEN invoice_number ~ '^INV-\d+-\d+$' THEN CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)
    ELSE 0
  END), 0)
  INTO max_counter
  FROM invoices
  WHERE invoice_number IS NOT NULL;
  
  -- Generate new number
  max_counter := max_counter + 1;
  new_number := 'INV-' || max_counter::TEXT;
  
  -- Ensure it doesn't exist
  WHILE EXISTS (SELECT 1 FROM invoices WHERE invoice_number = new_number) LOOP
    max_counter := max_counter + 1;
    new_number := 'INV-' || max_counter::TEXT;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update the trigger function
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_simple_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recreate the trigger
DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
CREATE TRIGGER trigger_set_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION set_invoice_number();

-- Step 6: Add back the unique constraint (only if no duplicates remain)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoice_number IS NOT NULL 
    GROUP BY invoice_number 
    HAVING COUNT(*) > 1
  ) THEN
    ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);
    RAISE NOTICE 'Unique constraint added successfully';
  ELSE
    RAISE NOTICE 'Skipping unique constraint - duplicates still exist';
  END IF;
END $$;

-- Step 7: Show current invoice numbers
SELECT 
  invoice_number,
  COUNT(*) as count,
  'Current invoice numbers' as status
FROM invoices 
WHERE invoice_number IS NOT NULL
GROUP BY invoice_number
ORDER BY invoice_number;

SELECT 'Invoice duplicate fix completed!' as result;
