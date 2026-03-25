-- Fixed Discount Codes RLS Policies
-- This fixes the permission denied error by using profiles table instead of auth.users

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Admins can insert discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Admins can update discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Admins can delete discount codes" ON discount_codes;

DROP POLICY IF EXISTS "Admins can view all discount usage" ON discount_code_usage;
DROP POLICY IF EXISTS "Admins can insert discount usage" ON discount_code_usage;

-- Create corrected policies using profiles table
CREATE POLICY "Admins can view all discount codes" ON discount_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert discount codes" ON discount_codes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update discount codes" ON discount_codes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete discount codes" ON discount_codes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policies for discount_code_usage
CREATE POLICY "Admins can view all discount usage" ON discount_code_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert discount usage" ON discount_code_usage
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Also fix the created_by reference to use profiles instead of auth.users
ALTER TABLE discount_codes 
DROP CONSTRAINT IF EXISTS discount_codes_created_by_fkey,
ADD CONSTRAINT discount_codes_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
