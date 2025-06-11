
-- Add missing timestamp columns to posts table for status tracking
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS claimed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS picked_up_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('claim_approved', 'pickup_ready', 'expiry_warning', 'rating_request')),
  read boolean NOT NULL DEFAULT false,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
  ON notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
  ON notifications 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
  ON notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Update posts table to track status changes with timestamps
CREATE OR REPLACE FUNCTION update_post_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update timestamps based on status changes
  IF NEW.status = 'CLAIMED' AND OLD.status = 'POSTED' THEN
    NEW.claimed_at = now();
  ELSIF NEW.status = 'PICKED_UP' AND OLD.status = 'CLAIMED' THEN
    NEW.picked_up_at = now();
  ELSIF NEW.status = 'COMPLETED' AND OLD.status = 'PICKED_UP' THEN
    NEW.completed_at = now();
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post status updates
DROP TRIGGER IF EXISTS post_status_timestamp_trigger ON posts;
CREATE TRIGGER post_status_timestamp_trigger
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_status_timestamp();

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_post_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, post_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_post_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create claim notification
CREATE OR REPLACE FUNCTION notify_claim_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- When a post is claimed, notify the owner
  IF NEW.status = 'CLAIMED' AND OLD.status = 'POSTED' AND NEW.claimed_by IS NOT NULL THEN
    PERFORM create_notification(
      NEW.owner_id,
      'Post Claimed!',
      'Someone has claimed your ' || NEW.type || ': ' || NEW.title,
      'claim_approved',
      NEW.id
    );
    
    -- Notify the claimer
    PERFORM create_notification(
      NEW.claimed_by,
      'Claim Successful!',
      'You have successfully claimed: ' || NEW.title,
      'claim_approved',
      NEW.id
    );
  END IF;
  
  -- When pickup is approved, notify the claimer
  IF NEW.status = 'PICKED_UP' AND OLD.status = 'CLAIMED' AND NEW.claimed_by IS NOT NULL THEN
    PERFORM create_notification(
      NEW.claimed_by,
      'Pickup Approved!',
      'You can now pick up: ' || NEW.title,
      'pickup_ready',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for claim notifications
DROP TRIGGER IF EXISTS claim_notification_trigger ON posts;
CREATE TRIGGER claim_notification_trigger
  AFTER UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_claim_approved();

-- Update ratings table structure if needed
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id, post_id)
);

-- Enable RLS on ratings
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ratings
CREATE POLICY "Users can view ratings they gave or received" 
  ON ratings 
  FOR SELECT 
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create ratings" 
  ON ratings 
  FOR INSERT 
  WITH CHECK (auth.uid() = from_user_id);

-- Update profiles table to include rating statistics
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings integer DEFAULT 0;

-- Function to update user rating statistics
CREATE OR REPLACE FUNCTION update_user_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the recipient's rating statistics
  UPDATE profiles 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM ratings 
      WHERE to_user_id = NEW.to_user_id
    ),
    total_ratings = (
      SELECT COUNT(*) 
      FROM ratings 
      WHERE to_user_id = NEW.to_user_id
    )
  WHERE id = NEW.to_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for rating statistics
DROP TRIGGER IF EXISTS rating_stats_trigger ON ratings;
CREATE TRIGGER rating_stats_trigger
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_stats();
