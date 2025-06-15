
-- Update the function to handle different expiry times for donations vs requests
CREATE OR REPLACE FUNCTION public.delete_expired_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired donation posts after 24 hours
  DELETE FROM posts 
  WHERE type = 'donation' 
  AND expiry_date < NOW() - INTERVAL '24 hours'
  AND status = 'POSTED';
  
  -- Delete expired request posts after 2 days (48 hours)
  DELETE FROM posts 
  WHERE type = 'request' 
  AND expiry_date < NOW() - INTERVAL '2 days'
  AND status = 'POSTED';
END;
$$;
