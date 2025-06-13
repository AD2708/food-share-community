
-- Create a table to track user interactions (claims and offers)
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('claim', 'offer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, post_id, interaction_type)
);

-- Enable RLS
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own interactions" 
  ON public.user_interactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions" 
  ON public.user_interactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" 
  ON public.user_interactions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Post owners can view interactions on their posts"
  ON public.user_interactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = user_interactions.post_id 
      AND posts.owner_id = auth.uid()
    )
  );

CREATE POLICY "Post owners can update interactions on their posts"
  ON public.user_interactions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = user_interactions.post_id 
      AND posts.owner_id = auth.uid()
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_user_interactions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timestamp updates
DROP TRIGGER IF EXISTS user_interactions_updated_at ON user_interactions;
CREATE TRIGGER user_interactions_updated_at
  BEFORE UPDATE ON user_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_interactions_timestamp();
