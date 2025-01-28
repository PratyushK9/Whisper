/*
  # Add admin privileges and unlike functionality

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key, references auth.users)
      - `created_at` (timestamp)

  2. New Functions
    - `is_admin()`: Check if current user is admin
    - `admin_delete_confession()`: Allow admins to delete confessions
    - `toggle_like()`: Toggle like status for a confession

  3. Security
    - Enable RLS on admin_users table
    - Add policies for admin operations
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
  );
END;
$$;

-- Create function for admin to delete confession
CREATE OR REPLACE FUNCTION admin_delete_confession(confession_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  DELETE FROM confessions
  WHERE id = confession_id;
END;
$$;

-- Create likes table for tracking user likes
CREATE TABLE IF NOT EXISTS confession_likes (
  user_id uuid REFERENCES auth.users(id),
  confession_id uuid REFERENCES confessions(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, confession_id)
);

-- Enable RLS on likes table
ALTER TABLE confession_likes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their likes
CREATE POLICY "Users can manage their likes"
  ON confession_likes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to toggle like
CREATE OR REPLACE FUNCTION toggle_like(confession_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  liked boolean;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if like exists
  IF EXISTS (
    SELECT 1 FROM confession_likes
    WHERE user_id = auth.uid() AND confession_id = toggle_like.confession_id
  ) THEN
    -- Unlike
    DELETE FROM confession_likes
    WHERE user_id = auth.uid() AND confession_id = toggle_like.confession_id;
    
    UPDATE confessions
    SET likes = likes - 1
    WHERE id = toggle_like.confession_id;
    
    liked := false;
  ELSE
    -- Like
    INSERT INTO confession_likes (user_id, confession_id)
    VALUES (auth.uid(), toggle_like.confession_id);
    
    UPDATE confessions
    SET likes = likes + 1
    WHERE id = toggle_like.confession_id;
    
    liked := true;
  END IF;

  RETURN liked;
END;
$$;