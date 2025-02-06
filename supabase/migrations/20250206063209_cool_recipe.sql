/*
  # Add Comment Likes Feature

  1. New Tables
    - `comment_likes`
      - Primary key (client_id, comment_id)
      - `client_id` (text)
      - `comment_id` (uuid, foreign key)
      - `created_at` (timestamptz)

  2. Changes
    - Add likes column to confession_comments table
    - Add function to toggle comment likes
*/

-- Add likes column to confession_comments if it doesn't exist
ALTER TABLE confession_comments 
ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  client_id text NOT NULL,
  comment_id uuid REFERENCES confession_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (client_id, comment_id)
);

-- Enable RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" 
ON comment_likes FOR SELECT 
TO PUBLIC
USING (true);

CREATE POLICY "Enable insert/delete for all users" 
ON comment_likes FOR ALL 
TO PUBLIC
USING (true)
WITH CHECK (true);

-- Create function to toggle comment like
CREATE OR REPLACE FUNCTION toggle_comment_like(target_comment_id uuid, client_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  liked boolean;
BEGIN
  -- Check if like exists
  IF EXISTS (
    SELECT 1 FROM comment_likes cl
    WHERE cl.client_id = toggle_comment_like.client_id 
    AND cl.comment_id = target_comment_id
  ) THEN
    -- Unlike
    DELETE FROM comment_likes cl
    WHERE cl.client_id = toggle_comment_like.client_id 
    AND cl.comment_id = target_comment_id;
    
    UPDATE confession_comments c
    SET likes = likes - 1
    WHERE c.id = target_comment_id;
    
    liked := false;
  ELSE
    -- Like
    INSERT INTO comment_likes (client_id, comment_id)
    VALUES (toggle_comment_like.client_id, target_comment_id);
    
    UPDATE confession_comments c
    SET likes = likes + 1
    WHERE c.id = target_comment_id;
    
    liked := true;
  END IF;

  RETURN liked;
END;
$$;