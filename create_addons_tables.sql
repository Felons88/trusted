-- Create addons table for booking additional services
-- This will store optional add-on services that customers can select during booking

CREATE TABLE IF NOT EXISTS addons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER DEFAULT 30, -- Additional time required for this addon
    category VARCHAR(50) DEFAULT 'extra', -- Categories: extra, protection, interior, exterior
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create booking_addons junction table to link addons to bookings
CREATE TABLE IF NOT EXISTS booking_addons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    price_at_booking DECIMAL(10,2) NOT NULL, -- Store price at time of booking in case addon prices change
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id, addon_id) -- Prevent duplicate addons for same booking
);

-- Add indexes for better performance
CREATE INDEX idx_addons_is_active ON addons(is_active);
CREATE INDEX idx_addons_category ON addons(category);
CREATE INDEX idx_addons_sort_order ON addons(sort_order);
CREATE INDEX idx_booking_addons_booking_id ON booking_addons(booking_id);
CREATE INDEX idx_booking_addons_addon_id ON booking_addons(addon_id);

-- Insert sample addons
INSERT INTO addons (name, description, price, duration_minutes, category, sort_order) VALUES
('Clay Bar Treatment', 'Removes embedded contaminants from paint surface for ultimate smoothness', 75.00, 60, 'protection', 1),
('Paint Sealant', 'Advanced polymer sealant providing 6+ months of protection', 50.00, 30, 'protection', 2),
('Engine Bay Cleaning', 'Detailed cleaning and dressing of engine compartment', 40.00, 45, 'extra', 3),
('Headlight Restoration', 'Restore cloudy headlights to crystal clear', 60.00, 40, 'extra', 4),
('Pet Hair Removal', 'Specialized tools and techniques to remove embedded pet hair', 35.00, 30, 'interior', 5),
('Leather Conditioning', 'Deep cleaning and conditioning of all leather surfaces', 45.00, 40, 'interior', 6),
('Odor Elimination', 'Ozone treatment to eliminate stubborn odors', 55.00, 60, 'interior', 7),
('Wheel & Tire Protection', 'Ceramic coating for wheels and tires', 80.00, 50, 'protection', 8),
('Fabric Protection', 'Scotchgard treatment for fabric upholstery', 40.00, 25, 'protection', 9),
('Chrome Polish', 'Deep cleaning and polishing of all chrome trim', 30.00, 20, 'extra', 10);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_addons_updated_at 
    BEFORE UPDATE ON addons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_addons ENABLE ROW LEVEL SECURITY;

-- Everyone can read active addons
CREATE POLICY "Active addons are viewable by everyone" ON addons
    FOR SELECT USING (is_active = true);

-- Authenticated users can see all addons (for admin purposes)
CREATE POLICY "Authenticated users can view all addons" ON addons
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can modify addons
CREATE POLICY "Service role can manage addons" ON addons
    FOR ALL USING (auth.role() = 'service_role');

-- Users can see addons for their own bookings
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

-- Service role can manage booking addons
CREATE POLICY "Service role can manage booking addons" ON booking_addons
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE addons IS 'Additional services that can be added to bookings';
COMMENT ON TABLE booking_addons IS 'Junction table linking addons to specific bookings';
COMMENT ON COLUMN addons.duration_minutes IS 'Additional time required beyond base service duration';
COMMENT ON COLUMN booking_addons.price_at_booking IS 'Price stored at time of booking to handle future price changes';
