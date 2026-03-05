-- Simple test to check what's in the services table
-- Run this first to see the actual structure

-- Check if services table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'services'
) as services_table_exists;

-- Show all columns in services table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'services' 
ORDER BY ordinal_position;

-- Show all data in services table (if it exists)
SELECT * FROM services LIMIT 10;

-- If no services exist, create a simple version
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'services'
    ) THEN
        CREATE TABLE services (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL DEFAULT 50.00,
            description TEXT,
            duration INTEGER DEFAULT 120,
            is_active BOOLEAN DEFAULT true
        );
        
        INSERT INTO services (name, price, description, duration) VALUES
        ('exterior', 50.00, 'Exterior wash and detail', 90),
        ('interior', 60.00, 'Interior cleaning and detail', 120),
        ('full', 100.00, 'Complete interior and exterior detail', 180),
        ('premium', 150.00, 'Premium detail with wax and protection', 240);
        
        RAISE NOTICE 'Created services table with basic services';
    END IF;
END $$;

-- Check if service_date column exists in bookings table
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'service_date'
) as service_date_exists;

-- Add service_date if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'service_date'
    ) THEN
        ALTER TABLE bookings ADD COLUMN service_date DATE;
        RAISE NOTICE 'Added service_date column to bookings table';
    END IF;

    -- Add total_cost if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'total_cost'
    ) THEN
        ALTER TABLE bookings ADD COLUMN total_cost DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added total_cost column to bookings table';
    END IF;
END $$;

-- Final check
SELECT 'Services count:' as info, COUNT(*) as count FROM services
UNION ALL
SELECT 'Bookings columns:', COUNT(*) FROM information_schema.columns WHERE table_name = 'bookings';
