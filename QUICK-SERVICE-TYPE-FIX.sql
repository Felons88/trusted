-- QUICK FIX FOR SERVICE TYPE ENUM
-- Run this script first to fix the enum immediately

-- Add 'test' to the service_type enum (this should fix the immediate error)
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'test';

-- Also add other common service types to prevent future errors
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'exterior';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'interior';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'full_detail';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'premium';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'basic';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'standard';

-- Verify the enum was updated
SELECT unnest(enum_range(NULL::service_type)) as allowed_service_types;
