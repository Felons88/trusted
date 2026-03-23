-- FIX INVOICES TABLE - ADD MISSING COLUMNS

-- Step 1: Check current invoices table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
ORDER BY ordinal_position;

-- Step 2: Add missing columns that the frontend expects
DO $$
BEGIN
  -- Add invoice_number column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_number') THEN
    ALTER TABLE invoices ADD COLUMN invoice_number TEXT;
  END IF;
  
  -- Add invoice_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_date') THEN
    ALTER TABLE invoices ADD COLUMN invoice_date DATE;
  END IF;
  
  -- Add due_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'due_date') THEN
    ALTER TABLE invoices ADD COLUMN due_date DATE;
  END IF;
  
  -- Add notes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'notes') THEN
    ALTER TABLE invoices ADD COLUMN notes TEXT;
  END IF;
  
  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'status') THEN
    ALTER TABLE invoices ADD COLUMN status TEXT DEFAULT 'draft';
  END IF;
  
  -- Add subtotal column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subtotal') THEN
    ALTER TABLE invoices ADD COLUMN subtotal DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  -- Add tax column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax') THEN
    ALTER TABLE invoices ADD COLUMN tax DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  -- Ensure total column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'total') THEN
    ALTER TABLE invoices ADD COLUMN total DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  -- Add paid_amount column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'paid_amount') THEN
    ALTER TABLE invoices ADD COLUMN paid_amount DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  -- Add balance_due column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'balance_due') THEN
    ALTER TABLE invoices ADD COLUMN balance_due DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Step 2.5: Fix invoice_items table structure
DO $$
BEGIN
  -- Create invoice_items table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items') THEN
    CREATE TABLE invoice_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      item_id UUID, -- Can reference services, add_ons, or be custom
      description TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price DECIMAL(10, 2) DEFAULT 0,
      total_price DECIMAL(10, 2) DEFAULT 0,
      item_type TEXT DEFAULT 'service', -- 'service', 'add_on', 'custom'
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
  
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'item_id') THEN
    ALTER TABLE invoice_items ADD COLUMN item_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'description') THEN
    ALTER TABLE invoice_items ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'quantity') THEN
    ALTER TABLE invoice_items ADD COLUMN quantity INTEGER DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'unit_price') THEN
    ALTER TABLE invoice_items ADD COLUMN unit_price DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'total_price') THEN
    ALTER TABLE invoice_items ADD COLUMN total_price DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'item_type') THEN
    ALTER TABLE invoice_items ADD COLUMN item_type TEXT DEFAULT 'service';
  END IF;
END $$;

-- Step 2.6: Handle existing duplicate invoice numbers
DO $$
BEGIN
  -- Find and fix duplicate invoice numbers
  WITH duplicates AS (
    SELECT 
      i.id,
      i.invoice_number,
      ROW_NUMBER() OVER (PARTITION BY i.invoice_number ORDER BY i.created_at) as rn
    FROM invoices i
    WHERE i.invoice_number IS NOT NULL
  ),
  to_update AS (
    SELECT id, invoice_number, rn
    FROM duplicates 
    WHERE rn > 1
  )
  UPDATE invoices 
  SET invoice_number = invoices.invoice_number || '-' || to_update.rn::TEXT
  FROM to_update 
  WHERE invoices.id = to_update.id;
  
  -- Log what was fixed
  IF (SELECT COUNT(*) FROM invoices WHERE invoice_number ~ '-\d+$') > 0 THEN
    RAISE NOTICE 'Fixed % duplicate invoice numbers', (SELECT COUNT(*) FROM invoices WHERE invoice_number ~ '-\d+$');
  END IF;
END $$;

-- Step 3: Create helper function for invoice number generation
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
  max_inv_number TEXT;
  prefix TEXT;
BEGIN
  -- Check what format exists in the database
  SELECT invoice_number 
  INTO max_inv_number
  FROM invoices 
  WHERE invoice_number IS NOT NULL 
  ORDER BY created_at DESC, id DESC 
  LIMIT 1;
  
  IF max_inv_number IS NULL THEN
    -- No existing invoices, start with INV-000001
    new_number := 'INV-000001';
  ELSIF max_inv_number LIKE 'INV-%' THEN
    -- Format: INV-000001
    counter := COALESCE(CAST(SUBSTRING(max_inv_number FROM 5) AS INTEGER), 0) + 1;
    new_number := 'INV-' || LPAD(counter::TEXT, 6, '0');
  ELSIF max_inv_number LIKE 'INV-202603-%' THEN
    -- Format: INV-202603-389 (date + counter)
    prefix := 'INV-202603-';
    counter := COALESCE(CAST(SUBSTRING(max_inv_number FROM 13) AS INTEGER), 0) + 1;
    new_number := prefix || counter::TEXT;
  ELSE
    -- Unknown format, start fresh
    new_number := 'INV-000001';
  END IF;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the actual trigger function (returns TRIGGER type)
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for auto invoice number
DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
CREATE TRIGGER trigger_set_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION set_invoice_number();

-- Step 6: Create trigger for balance calculation
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance_due := NEW.total - NEW.paid_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for balance calculation
DROP TRIGGER IF EXISTS trigger_calculate_balance ON invoices;
CREATE TRIGGER trigger_calculate_balance
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION calculate_invoice_balance();

-- Step 8: Verify the fixes
SELECT '=== INVOICES TABLE STRUCTURE FIXED ===' as info;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invoices' 
ORDER BY ordinal_position;

SELECT '=== INVOICE_ITEMS TABLE STRUCTURE FIXED ===' as info;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invoice_items' 
ORDER BY ordinal_position;

-- Show trigger status
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  'Trigger exists' as status
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_set_invoice_number', 'trigger_calculate_balance');

SELECT 'Invoices table schema updated successfully!' as result;
