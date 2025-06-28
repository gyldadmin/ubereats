-- Migration: Create user_status table
-- Created: 2025-01-27 13:08:11
-- Description: User status lookup table with public read access, admin-only write access

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_status table
CREATE TABLE user_status (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE
);

-- Create index on label for performance
CREATE INDEX idx_user_status_label ON user_status(label);

-- Enable Row Level Security
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is admin (reuse existing if available)
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Return true if user is admin in users_private table
    RETURN EXISTS (
        SELECT 1 
        FROM users_private 
        WHERE id = user_uuid 
        AND user_status = 'admin'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If users_private table doesn't exist or any error occurs, return false
        RETURN FALSE;
END;
$$;

-- RLS POLICIES

-- READ POLICY: Public Access (Read A)
CREATE POLICY "user_status_read_policy" ON user_status
    FOR SELECT
    USING (true); -- Public access - anyone can read

-- WRITE POLICIES: Admins Only (Write D)

-- INSERT: Only admins can create new status entries
CREATE POLICY "user_status_insert_policy" ON user_status
    FOR INSERT
    WITH CHECK (
        is_admin()  -- Only admins can insert
    );

-- UPDATE: Only admins can update status entries
CREATE POLICY "user_status_update_policy" ON user_status
    FOR UPDATE
    USING (
        is_admin()  -- Only admins can update
    )
    WITH CHECK (
        is_admin()  -- Only admins can update
    );

-- DELETE: Only admins can delete status entries
CREATE POLICY "user_status_delete_policy" ON user_status
    FOR DELETE
    USING (
        is_admin()  -- Only admins can delete
    );

-- Create or replace the updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_user_status_updated_at
    BEFORE UPDATE ON user_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE user_status IS 'User status lookup table with public read access, admin-only write access';
COMMENT ON COLUMN user_status.id IS 'Unique identifier for the user status record';
COMMENT ON COLUMN user_status.created_at IS 'When this user status was created';
COMMENT ON COLUMN user_status.updated_at IS 'When this user status was last modified (auto-updated)';
COMMENT ON COLUMN user_status.label IS 'Human-readable status label (unique)';

-- Grant necessary permissions
-- Note: RLS policies will control actual access, these grants enable the policies to work
GRANT ALL ON user_status TO authenticated;
GRANT SELECT ON user_status TO anon; -- Allow anonymous users to read (public access)

-- Insert initial data entries
-- Note: These inserts will bypass RLS policies since they're run as part of the migration
INSERT INTO user_status (label) VALUES
    ('member'),
    ('associate member'),
    ('past member'),
    ('guest'),
    ('mentor'),
    ('admin'); 