-- Add missing columns to google_reviews table
ALTER TABLE google_reviews 
ADD COLUMN IF NOT EXISTS time BIGINT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on google_review_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_reviews_google_review_id ON google_reviews(google_review_id);

-- Create index on time for sorting
CREATE INDEX IF NOT EXISTS idx_google_reviews_time ON google_reviews(time DESC);

-- Drop existing function if it exists (to avoid return type conflicts)
DROP FUNCTION IF EXISTS get_review_statistics();

-- Create the get_review_statistics function
CREATE FUNCTION get_review_statistics()
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  five_star BIGINT,
  four_star BIGINT,
  three_star BIGINT,
  two_star BIGINT,
  one_star BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_reviews,
    ROUND(AVG(rating)::NUMERIC, 2) as average_rating,
    COUNT(CASE WHEN rating = 5 THEN 1 END)::BIGINT as five_star,
    COUNT(CASE WHEN rating = 4 THEN 1 END)::BIGINT as four_star,
    COUNT(CASE WHEN rating = 3 THEN 1 END)::BIGINT as three_star,
    COUNT(CASE WHEN rating = 2 THEN 1 END)::BIGINT as two_star,
    COUNT(CASE WHEN rating = 1 THEN 1 END)::BIGINT as one_star
  FROM google_reviews
  WHERE is_approved = true;
END;
$$;
