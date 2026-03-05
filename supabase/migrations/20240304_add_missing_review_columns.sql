-- Add missing columns to google_reviews table
ALTER TABLE google_reviews 
ADD COLUMN IF NOT EXISTS author_url TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS review_text TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_google_reviews_author_name ON google_reviews(author_name);
CREATE INDEX IF NOT EXISTS idx_google_reviews_rating ON google_reviews(rating);
