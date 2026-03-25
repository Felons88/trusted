-- Add indexes for geographic data to improve query performance
CREATE INDEX IF NOT EXISTS idx_analytics_visits_country ON public.analytics_visits(country);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_region ON public.analytics_visits(region);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_city ON public.analytics_visits(city);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_ip_address ON public.analytics_visits(ip_address);

-- Add composite index for session queries
CREATE INDEX IF NOT EXISTS idx_analytics_visits_session_created ON public.analytics_visits(session_id, created_at DESC);

-- Update existing records to ensure they have the geographic columns
-- This is just a safety check - the columns should already exist
ALTER TABLE public.analytics_visits 
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS city text;

-- Add comment about geographic data
COMMENT ON COLUMN public.analytics_visits.country IS 'Country from IP geolocation lookup';
COMMENT ON COLUMN public.analytics_visits.region IS 'Region/State from IP geolocation lookup';
COMMENT ON COLUMN public.analytics_visits.city IS 'City from IP geolocation lookup';
