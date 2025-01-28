/*
  # Create Confessions Table

  1. New Tables
    - `confessions`
      - `id` (uuid, primary key)
      - `content` (text, required)
      - `created_at` (timestamp with timezone)
      - `likes` (integer, default: 0)

  2. Security
    - Enable RLS on `confessions` table
    - Add policies for:
      - Anyone can create a confession
      - Anyone can read confessions
*/

CREATE TABLE IF NOT EXISTS confessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  likes integer DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create confessions
CREATE POLICY "Anyone can create confessions"
ON confessions FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anyone to read confessions
CREATE POLICY "Anyone can read confessions"
ON confessions FOR SELECT
TO anon
USING (true);