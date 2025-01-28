/*
  # Add admin functionality
  
  1. Changes
    - Create admin_users table to track admin accounts
    - Create function to check if a user is an admin
    - Create function for admin to delete confessions
  
  2. Security
    - Functions are secured with role checks
    - Only admins can delete confessions
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