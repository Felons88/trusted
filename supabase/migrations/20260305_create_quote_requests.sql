-- Create quote_requests table
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  car_make TEXT NOT NULL,
  car_model TEXT NOT NULL,
  car_year TEXT NOT NULL,
  address TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'full_detail',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_quote_requests_email ON quote_requests(email);

-- Add RLS policies
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (admin) to read all quote requests
CREATE POLICY "Admins can view all quote requests" ON quote_requests
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users (admin) to insert quote requests
CREATE POLICY "Admins can create quote requests" ON quote_requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users (admin) to update quote requests
CREATE POLICY "Admins can update quote requests" ON quote_requests
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users (admin) to delete quote requests
CREATE POLICY "Admins can delete quote requests" ON quote_requests
  FOR DELETE USING (auth.role() = 'authenticated');
