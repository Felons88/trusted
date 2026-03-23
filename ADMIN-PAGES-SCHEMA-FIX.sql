-- ADMIN PAGES SCHEMA VERIFICATION AND FIXES
-- This script ensures all tables have the correct structure for admin pages

-- Step 1: Verify services table structure
DO $$
BEGIN
    -- Remove old duration_hours column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'duration_hours') THEN
        ALTER TABLE services DROP COLUMN duration_hours;
        RAISE NOTICE 'Removed old duration_hours column from services table';
    END IF;
    
    -- Remove old base_price column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'base_price') THEN
        ALTER TABLE services DROP COLUMN base_price;
        RAISE NOTICE 'Removed old base_price column from services table';
    END IF;
    
    -- Remove features column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'features') THEN
        ALTER TABLE services DROP COLUMN features;
        RAISE NOTICE 'Removed features column from services table';
    END IF;
    
    -- Ensure all required service columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'base_price_sedan') THEN
        ALTER TABLE services ADD COLUMN base_price_sedan DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'base_price_suv') THEN
        ALTER TABLE services ADD COLUMN base_price_suv DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'base_price_truck') THEN
        ALTER TABLE services ADD COLUMN base_price_truck DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'base_price_van') THEN
        ALTER TABLE services ADD COLUMN base_price_van DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'duration_minutes') THEN
        ALTER TABLE services ADD COLUMN duration_minutes INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'type') THEN
        ALTER TABLE services ADD COLUMN type TEXT;
    END IF;
    
    RAISE NOTICE 'Services table columns verified/updated';
END $$;

-- Step 2: Verify clients table structure
DO $$
BEGIN
    -- Ensure all required client columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'user_id') THEN
        ALTER TABLE clients ADD COLUMN user_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'address') THEN
        ALTER TABLE clients ADD COLUMN address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'city') THEN
        ALTER TABLE clients ADD COLUMN city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'state') THEN
        ALTER TABLE clients ADD COLUMN state TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'zip_code') THEN
        ALTER TABLE clients ADD COLUMN zip_code TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'notes') THEN
        ALTER TABLE clients ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status') THEN
        ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'total_spent') THEN
        ALTER TABLE clients ADD COLUMN total_spent DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'total_bookings') THEN
        ALTER TABLE clients ADD COLUMN total_bookings INTEGER DEFAULT 0;
    END IF;
    
    RAISE NOTICE 'Clients table columns verified/updated';
END $$;

-- Step 3: Verify vehicles table structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'vehicle_size') THEN
        ALTER TABLE vehicles ADD COLUMN vehicle_size TEXT DEFAULT 'sedan';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'status') THEN
        ALTER TABLE vehicles ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    RAISE NOTICE 'Vehicles table columns verified/updated';
END $$;

-- Step 4: Verify bookings table structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'service_address') THEN
        ALTER TABLE bookings ADD COLUMN service_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'service_city') THEN
        ALTER TABLE bookings ADD COLUMN service_city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'service_state') THEN
        ALTER TABLE bookings ADD COLUMN service_state TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'service_zip') THEN
        ALTER TABLE bookings ADD COLUMN service_zip TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'estimated_duration') THEN
        ALTER TABLE bookings ADD COLUMN estimated_duration INTEGER;
    END IF;
    
    RAISE NOTICE 'Bookings table columns verified/updated';
END $$;

-- Step 5: Verify add_ons table structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'add_ons' AND column_name = 'category') THEN
        ALTER TABLE add_ons ADD COLUMN category TEXT DEFAULT 'extra';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'add_ons' AND column_name = 'duration_minutes') THEN
        ALTER TABLE add_ons ADD COLUMN duration_minutes INTEGER;
    END IF;
    
    RAISE NOTICE 'Add-ons table columns verified/updated';
END $$;

-- Step 6: Show current table structures
SELECT 
    'services' as table_name,
    string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'services' 
GROUP BY table_name

UNION ALL

SELECT 
    'clients' as table_name,
    string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'clients' 
GROUP BY table_name

UNION ALL

SELECT 
    'vehicles' as table_name,
    string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
GROUP BY table_name

UNION ALL

SELECT 
    'bookings' as table_name,
    string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'bookings' 
GROUP BY table_name

UNION ALL

SELECT 
    'add_ons' as table_name,
    string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'add_ons' 
GROUP BY table_name;

SELECT 'Admin pages schema verification completed!' as result;
