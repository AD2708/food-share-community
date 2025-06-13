
-- Add a trigger to automatically remove expired posts after 24 hours
CREATE OR REPLACE FUNCTION public.delete_expired_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM posts 
  WHERE type = 'donation' 
  AND expiry_date < NOW() - INTERVAL '24 hours'
  AND status = 'POSTED';
END;
$$;

-- Create a function to be called periodically (you can set this up as a cron job)
-- For now, we'll call it manually or on app load
-- You could also set up a pg_cron job if needed

-- Add location coordinates to posts table for better mapping
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update existing posts with sample coordinates (you'll need to geocode real addresses)
-- This is just to have some data for the map
UPDATE posts 
SET 
  latitude = 40.7128 + (RANDOM() - 0.5) * 0.1,
  longitude = -74.0060 + (RANDOM() - 0.5) * 0.1
WHERE latitude IS NULL;
