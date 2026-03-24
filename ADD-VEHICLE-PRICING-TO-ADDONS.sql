-- ADD VEHICLE SIZE PRICING TO ADD_ONS TABLE
-- This script adds vehicle-specific pricing columns to the add_ons table

-- Add vehicle size pricing columns if they don't exist
ALTER TABLE add_ons 
ADD COLUMN IF NOT EXISTS base_price_sedan DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS base_price_suv DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS base_price_truck DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS base_price_van DECIMAL(10,2);

-- Migrate existing single price to vehicle size columns
UPDATE add_ons 
SET 
    base_price_sedan = price,
    base_price_suv = price * 1.25,  -- 25% more for SUV
    base_price_truck = price * 1.35, -- 35% more for truck
    base_price_van = price * 1.45    -- 45% more for van
WHERE price IS NOT NULL 
AND (base_price_sedan IS NULL OR base_price_suv IS NULL OR base_price_truck IS NULL OR base_price_van IS NULL);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'add_ons' 
AND table_schema = 'public'
AND column_name LIKE '%price%'
ORDER BY ordinal_position;

-- Show sample data
SELECT 'SAMPLE ADD-ONS DATA' as info, 
       name, 
       price,
       base_price_sedan, 
       base_price_suv, 
       base_price_truck, 
       base_price_van,
       category,
       is_active
FROM add_ons 
LIMIT 5;
