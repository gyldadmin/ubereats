-- Migration: Add push_enabled field to users_private
-- Date: 2025-01-24 10:00:53
-- Description: Adds push_enabled boolean field to track user push notification permissions

-- Add push_enabled field to users_private
ALTER TABLE users_private 
ADD COLUMN push_enabled BOOLEAN DEFAULT false NOT NULL;

-- Create index for push_enabled lookups
CREATE INDEX idx_users_private_push_enabled ON users_private(push_enabled);

-- Add helpful comment
COMMENT ON COLUMN users_private.push_enabled IS 'Whether user has enabled push notifications in the app'; 