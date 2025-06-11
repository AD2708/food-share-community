
-- Fix RLS policies for posts table to allow claiming
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;

-- Create comprehensive RLS policies for posts
CREATE POLICY "Users can view all posts" 
  ON posts 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create posts" 
  ON posts 
  FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update posts they own or claim" 
  ON posts 
  FOR UPDATE 
  USING (
    auth.uid() = owner_id OR 
    (status = 'POSTED' AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Users can delete their own posts" 
  ON posts 
  FOR DELETE 
  USING (auth.uid() = owner_id);
