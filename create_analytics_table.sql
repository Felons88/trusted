-- Create analytics/traffic tracking table
CREATE TABLE IF NOT EXISTS public.analytics_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Page information
  page_url text NOT NULL,
  page_title text,
  page_path text NOT NULL,
  
  -- Referrer information
  referrer_url text,
  referrer_domain text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  
  -- User/Session information
  session_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  
  -- Device/Browser information
  is_bot boolean DEFAULT false,
  bot_name text,
  device_type text, -- mobile, tablet, desktop
  browser_name text,
  browser_version text,
  os_name text,
  os_version text,
  
  -- Geographic information
  country text,
  region text,
  city text,
  
  -- Performance metrics
  page_load_time bigint, -- milliseconds (bigint to handle larger values)
  
  -- Additional metadata
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_visits_created_at ON public.analytics_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_page_path ON public.analytics_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_referrer_domain ON public.analytics_visits(referrer_domain);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_is_bot ON public.analytics_visits(is_bot);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_user_id ON public.analytics_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_session_id ON public.analytics_visits(session_id);

-- Enable RLS
ALTER TABLE public.analytics_visits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for tracking)
CREATE POLICY "Allow anonymous insert for analytics"
  ON public.analytics_visits
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow authenticated inserts
CREATE POLICY "Allow authenticated insert for analytics"
  ON public.analytics_visits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for admins to view all analytics
CREATE POLICY "Allow admins to view all analytics"
  ON public.analytics_visits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Grant permissions
GRANT INSERT ON public.analytics_visits TO anon;
GRANT INSERT ON public.analytics_visits TO authenticated;
GRANT SELECT ON public.analytics_visits TO authenticated;

-- Add comment
COMMENT ON TABLE public.analytics_visits IS 'Tracks website visits, referrers, and bot traffic for analytics';
