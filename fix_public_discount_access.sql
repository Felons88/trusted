-- Add public access policy for active discount codes
-- This allows all users (including clients) to validate discount codes

-- Create policy for public access to active discount codes
CREATE POLICY "Public can view active discount codes" ON discount_codes
    FOR SELECT USING (
        is_active = true
    );

-- Ensure RLS is enabled
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
