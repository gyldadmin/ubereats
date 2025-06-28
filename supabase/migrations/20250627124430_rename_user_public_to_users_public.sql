-- Migration: Rename user_public table to users_public
-- Created: 2025-01-27 12:44:30
-- Description: Rename user_public table and all associated objects to users_public

-- Rename the table
ALTER TABLE user_public RENAME TO users_public;

-- Rename the index
ALTER INDEX idx_user_public_user_id RENAME TO idx_users_public_user_id;

-- Rename the trigger
ALTER TRIGGER update_user_public_updated_at ON users_public RENAME TO update_users_public_updated_at;

-- Drop old policies
DROP POLICY IF EXISTS "user_public_read_policy" ON users_public;
DROP POLICY IF EXISTS "user_public_insert_policy" ON users_public;
DROP POLICY IF EXISTS "user_public_update_policy" ON users_public;
DROP POLICY IF EXISTS "user_public_delete_policy" ON users_public;

-- Create new policies with correct names
CREATE POLICY "users_public_read_policy" ON users_public
    FOR SELECT
    USING (true); -- Public access - anyone can read

CREATE POLICY "users_public_insert_policy" ON users_public
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id  -- User can only insert their own record
        OR is_admin()         -- Or user is admin
    );

CREATE POLICY "users_public_update_policy" ON users_public
    FOR UPDATE
    USING (
        auth.uid() = user_id  -- User can only update their own record
        OR is_admin()         -- Or user is admin
    )
    WITH CHECK (
        auth.uid() = user_id  -- Ensure user_id doesn't change to someone else's
        OR is_admin()         -- Or user is admin
    );

CREATE POLICY "users_public_delete_policy" ON users_public
    FOR DELETE
    USING (
        auth.uid() = user_id  -- User can only delete their own record
        OR is_admin()         -- Or user is admin
    );

-- Update table comment
COMMENT ON TABLE users_public IS 'Public user profile information that can be read by anyone on the internet';

-- Update column comments
COMMENT ON COLUMN users_public.id IS 'Unique identifier for the public profile record';
COMMENT ON COLUMN users_public.created_at IS 'When this public profile was created';
COMMENT ON COLUMN users_public.updated_at IS 'When this public profile was last modified (auto-updated)';
COMMENT ON COLUMN users_public.user_id IS 'References auth.users(id) - owner of this public profile'; 