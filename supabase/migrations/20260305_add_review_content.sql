-- Add review content columns to google_reviews table
ALTER TABLE google_reviews 
ADD COLUMN IF NOT EXISTS review_text TEXT,
ADD COLUMN IF NOT EXISTS author_url TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
