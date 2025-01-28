/*
  # Remove admin privileges and update policies

  1. Changes
    - Drop admin-related functions and tables
    - Update confession policies
    
  2. Security
    - Remove admin-specific functionality
    - Ensure public read/write access remains
*/

-- Drop admin-related objects safely
DROP FUNCTION IF EXISTS admin_delete_confession(uuid);
DROP FUNCTION IF EXISTS is_admin();
DROP TABLE IF EXISTS admin_users;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable delete for admins" ON confessions;
DROP POLICY IF EXISTS "Enable read access for all users" ON confessions;
DROP POLICY IF EXISTS "Enable insert access for all users" ON confessions;

-- Create new policies
CREATE POLICY "Enable read access for all users" 
ON confessions FOR SELECT 
TO PUBLIC
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON confessions FOR INSERT 
TO PUBLIC
WITH CHECK (true);