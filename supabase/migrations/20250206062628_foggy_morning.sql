/*
  # Add Comments Feature

  1. New Tables
    - `confession_comments`
      - `id` (uuid, primary key)
      - `content` (text)
      - `confession_id` (uuid, foreign key)
      - `client_id` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `confession_comments` table
    - Add policies for public access to read and create comments
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS confession_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  confession_id uuid REFERENCES confessions(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE confession_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" 
ON confession_comments FOR SELECT 
TO PUBLIC
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON confession_comments FOR INSERT 
TO PUBLIC
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_confession_comments_confession_id 
ON confession_comments(confession_id);