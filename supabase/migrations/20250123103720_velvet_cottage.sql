/*
  # Remove admin functionality and enable public access
  
  1. Changes
    - Drop admin-related tables and functions
    - Update RLS policies for public access
  
  2. Security
    - Enable public read/write access to confessions
    - Remove admin-specific functionality
*/

-- Drop admin-related objects
DROP TABLE IF EXISTS admin_users;
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS admin_delete_confession();

-- Update RLS policies for confessions table
DROP POLICY IF EXISTS "Anyone can create confessions" ON confessions;
DROP POLICY IF EXISTS "Anyone can read confessions" ON confessions;

-- Create new policies for public access
CREATE POLICY "Enable read access for all users" ON confessions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON confessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for likes" ON confessions
  FOR UPDATE USING (true);