/*
  # Remove all confessions data
  
  1. Changes
    - Remove all data from confession_likes and confessions tables
    - Handle foreign key constraints properly by truncating in correct order
*/

-- Truncate tables in correct order to handle foreign key constraints
TRUNCATE TABLE confession_likes CASCADE;
TRUNCATE TABLE confessions CASCADE;