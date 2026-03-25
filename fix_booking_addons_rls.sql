-- Fix booking_addons RLS policies to allow users to insert addons for their own bookings

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view addons for their bookings" ON booking_addons;
DROP POLICY IF EXISTS "Service role can manage booking addons" ON booking_addons;

-- Create new policies that allow users to manage addons for their own bookings
-- Users can insert addons for their own bookings
CREATE POLICY "Users can insert addons for their bookings" ON booking_addons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.id = booking_addons.booking_id 
            AND EXISTS (
                SELECT 1 FROM clients 
                WHERE clients.id = bookings.client_id 
                AND clients.user_id = auth.uid()
            )
        )
    );

-- Users can update addons for their own bookings
CREATE POLICY "Users can update addons for their bookings" ON booking_addons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.id = booking_addons.booking_id 
            AND EXISTS (
                SELECT 1 FROM clients 
                WHERE clients.id = bookings.client_id 
                AND clients.user_id = auth.uid()
            )
        )
    );

-- Users can delete addons for their own bookings
CREATE POLICY "Users can delete addons for their bookings" ON booking_addons
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.id = booking_addons.booking_id 
            AND EXISTS (
                SELECT 1 FROM clients 
                WHERE clients.id = bookings.client_id 
                AND clients.user_id = auth.uid()
            )
        )
    );

-- Users can view addons for their own bookings
CREATE POLICY "Users can view addons for their bookings" ON booking_addons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.id = booking_addons.booking_id 
            AND EXISTS (
                SELECT 1 FROM clients 
                WHERE clients.id = bookings.client_id 
                AND clients.user_id = auth.uid()
            )
        )
    );

-- Service role can manage all booking addons
CREATE POLICY "Service role can manage booking addons" ON booking_addons
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON POLICY "Users can insert addons for their bookings" ON booking_addons IS 'Allows authenticated users to insert addons for their own bookings';
COMMENT ON POLICY "Users can update addons for their bookings" ON booking_addons IS 'Allows authenticated users to update addons for their own bookings';
COMMENT ON POLICY "Users can delete addons for their bookings" ON booking_addons IS 'Allows authenticated users to delete addons for their own bookings';
