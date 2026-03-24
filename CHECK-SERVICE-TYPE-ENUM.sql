-- CHECK SERVICE TYPE ENUM
-- This script checks what values are allowed for the service_type enum

-- Check the enum definition
SELECT 'SERVICE_TYPE ENUM VALUES' as info,
       unnest(enum_range(NULL::service_type)) as allowed_values;

-- Check what service_type values are currently being used in bookings
SELECT 'CURRENT BOOKING SERVICE TYPES' as info,
       service_type,
       COUNT(*) as count
FROM bookings
WHERE service_type IS NOT NULL
GROUP BY service_type
ORDER BY count DESC;

-- Check services table to see what types are available
SELECT 'SERVICES TABLE TYPES' as info,
       type,
       COUNT(*) as count
FROM services
WHERE type IS NOT NULL
GROUP BY type
ORDER BY count DESC;

-- Show sample services data
SELECT 'SAMPLE SERVICES' as info,
       id,
       name,
       type,
       is_active
FROM services
LIMIT 5;

-- Show recent booking attempts that might have failed
SELECT 'RECENT BOOKINGS' as info,
       id,
       service_type,
       created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 5;
