/*
  # Simplify likes system
  
  1. Changes
    - Remove authentication requirement for likes
    - Update toggle_like function to work without auth
    - Add client_id tracking for likes instead of user_id
*/

-- Drop the old confession_likes table and function
DROP TABLE IF EXISTS confession_likes;
DROP FUNCTION IF EXISTS toggle_like(uuid);

-- Create new confession_likes table using client_id instead of user_id
CREATE TABLE IF NOT EXISTS confession_likes (
  client_id text NOT NULL,
  confession_id uuid REFERENCES confessions(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (client_id, confession_id)
);

-- Enable RLS
ALTER TABLE confession_likes ENABLE ROW LEVEL SECURITY;

-- Allow public access to confession_likes
CREATE POLICY "Enable read access for all users" 
ON confession_likes FOR SELECT 
TO PUBLIC
USING (true);

CREATE POLICY "Enable insert/delete for all users" 
ON confession_likes FOR ALL 
TO PUBLIC
USING (true)
WITH CHECK (true);

-- Create new toggle_like function that works without auth
CREATE OR REPLACE FUNCTION toggle_like(target_confession_id uuid, client_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  liked boolean;
BEGIN
  -- Check if like exists
  IF EXISTS (
    SELECT 1 FROM confession_likes cl
    WHERE cl.client_id = toggle_like.client_id 
    AND cl.confession_id = target_confession_id
  ) THEN
    -- Unlike
    DELETE FROM confession_likes cl
    WHERE cl.client_id = toggle_like.client_id 
    AND cl.confession_id = target_confession_id;
    
    UPDATE confessions c
    SET likes = likes - 1
    WHERE c.id = target_confession_id;
    
    liked := false;
  ELSE
    -- Like
    INSERT INTO confession_likes (client_id, confession_id)
    VALUES (toggle_like.client_id, target_confession_id);
    
    UPDATE confessions c
    SET likes = likes + 1
    WHERE c.id = target_confession_id;
    
    liked := true;
  END IF;

  RETURN liked;
END;
$$;