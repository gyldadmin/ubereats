-- Migration: Remove NOT NULL constraints from users_public
-- Date: 2025-01-26 16:00:00
-- Description: Remove NOT NULL constraints on first and full_name to allow trigger to work

-- Remove NOT NULL constraint from first column
ALTER TABLE users_public ALTER COLUMN first DROP NOT NULL;

-- Remove NOT NULL constraint from full_name column
ALTER TABLE users_public ALTER COLUMN full_name DROP NOT NULL;
