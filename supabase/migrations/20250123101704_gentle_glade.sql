/*
  # Add title column and likes function
  
  1. Changes
    - Add title column to confessions table
    - Create increment_likes function for handling likes
  
  2. Security
    - Function is accessible to authenticated and anonymous users
*/

-- Add title column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'confessions' AND column_name = 'title'
  ) THEN
    ALTER TABLE confessions ADD COLUMN title text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Create function for incrementing likes
CREATE OR REPLACE FUNCTION increment_likes(confession_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE confessions
  SET likes = likes + 1
  WHERE id = confession_id;
END;
$$;