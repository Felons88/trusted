-- Add service_location column to bookings table
-- This column stores whether service is provided at client location ('mobile') or shop ('shop')

ALTER TABLE bookings 
ADD COLUMN service_location VARCHAR(20) DEFAULT 'mobile' NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_bookings_service_location ON bookings(service_location);

-- Add check constraint to ensure valid values
ALTER TABLE bookings 
ADD CONSTRAINT chk_bookings_service_location 
CHECK (service_location IN ('mobile', 'shop'));

-- Update existing bookings to have default value
UPDATE bookings 
SET service_location = 'mobile' 
WHERE service_location IS NULL;

COMMENT ON COLUMN bookings.service_location IS 'Service location: mobile (at client address) or shop (at shop address)';
