-- Add Google credentials to settings (update the first/only record)
UPDATE settings 
SET 
  google_place_id = 'ChIJewvufztps1IRhfOC0LyE0SM',
  google_api_key = 'AIzaSyA6R2hyGEImgakhIE5y6Nb2T3LNuctmGxc'
WHERE id = (SELECT id FROM settings LIMIT 1);

-- If no settings record exists, insert one
INSERT INTO settings (id, google_place_id, google_api_key)
SELECT gen_random_uuid(), 'ChIJewvufztps1IRhfOC0LyE0SM', 'AIzaSyA6R2hyGEImgakhIE5y6Nb2T3LNuctmGxc'
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);
