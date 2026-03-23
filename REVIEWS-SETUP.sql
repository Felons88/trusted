-- REVIEWS TABLE SETUP
-- This script creates the missing review-related tables and functions

-- Create google_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.google_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reviewer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    time TIMESTAMPTZ DEFAULT NOW(),
    is_approved BOOLEAN DEFAULT true,
    reviewer_profile_url TEXT,
    review_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table if it doesn't exist (for internal reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT true,
    response TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create get_review_statistics function if it doesn't exist
CREATE OR REPLACE FUNCTION public.get_review_statistics()
RETURNS TABLE (
    total_reviews BIGINT,
    average_rating DECIMAL(3,2),
    rating_distribution JSONB,
    total_responses BIGINT,
    last_sync_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(COUNT(*), 0) as total_reviews,
        COALESCE(ROUND(AVG(rating), 2), 0) as average_rating,
        COALESCE(
            jsonb_build_object(
                '5_star', COUNT(*) FILTER (WHERE rating = 5),
                '4_star', COUNT(*) FILTER (WHERE rating = 4),
                '3_star', COUNT(*) FILTER (WHERE rating = 3),
                '2_star', COUNT(*) FILTER (WHERE rating = 2),
                '1_star', COUNT(*) FILTER (WHERE rating = 1)
            ),
            '{}'::jsonb
        ) as rating_distribution,
        COALESCE(COUNT(*) FILTER (WHERE response IS NOT NULL), 0) as total_responses,
        MAX(created_at) as last_sync_at
    FROM public.google_reviews 
    WHERE is_approved = true;
    
    -- If no google reviews exist, return default values
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            0::BIGINT,
            4.5::DECIMAL(3,2),
            '{}'::jsonb,
            0::BIGINT,
            NULL::TIMESTAMPTZ;
    END IF;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_google_reviews_approved ON public.google_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_google_reviews_time ON public.google_reviews(time DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON public.reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);

-- Insert some sample data for testing
INSERT INTO public.google_reviews (reviewer_name, rating, comment, is_approved) VALUES
('John D.', 5, 'Excellent service! Very professional and thorough.', true),
('Sarah M.', 5, 'Great attention to detail. My car looks brand new!', true),
('Mike R.', 4, 'Good service, on time and quality work.', true)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for google_reviews
CREATE POLICY "Anyone can view approved google reviews" ON public.google_reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Admins can manage google reviews" ON public.google_reviews
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Create policies for reviews
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Admins can manage reviews" ON public.reviews
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

SELECT 'Reviews setup completed successfully!' as result;
