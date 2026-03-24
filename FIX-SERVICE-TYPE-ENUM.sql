-- FIX SERVICE TYPE ENUM
-- This script fixes the service_type enum to include common service types

-- First, check current enum values
SELECT 'CURRENT ENUM VALUES' as info,
       unnest(enum_range(NULL::service_type)) as allowed_values;

-- Add missing common service types to the enum
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'exterior';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'interior';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'full_detail';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'premium';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'basic';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'standard';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'test';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'express';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'deluxe';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'mobile';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'wash';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'wax';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'polish';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'ceramic';

-- Show updated enum values
SELECT 'UPDATED ENUM VALUES' as info,
       unnest(enum_range(NULL::service_type)) as allowed_values;

-- Update any existing bookings with invalid service_type to 'exterior'
UPDATE bookings 
SET service_type = 'exterior' 
WHERE service_type NOT IN (SELECT unnest(enum_range(NULL::service_type)));

-- Show the updated bookings
SELECT 'UPDATED BOOKINGS' as info,
       service_type,
       COUNT(*) as count
FROM bookings
GROUP BY service_type
ORDER BY count DESC;
