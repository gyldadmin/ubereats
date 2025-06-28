-- Migration: Create users_private table
-- Created: 2025-01-27 12:50:43
-- Description: Private user data accessible only to row owners and admins

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users_private table
CREATE TABLE users_private (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on user_id for performance
CREATE INDEX idx_users_private_user_id ON users_private(user_id);

-- Enable Row Level Security
ALTER TABLE users_private ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is admin
-- This allows RLS policies to access users_private table safely
-- Note: This function will be self-referential once the table exists
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

-- READ POLICY: Row Owners Only + Admins
CREATE POLICY "users_private_read_policy" ON users_private
    FOR SELECT
    USING (
        auth.uid() = user_id  -- User can only read their own record
        OR is_admin()         -- Or user is admin
    );

-- WRITE POLICIES: Row Owners Only + Admins

-- INSERT: Users can only create their own record
CREATE POLICY "users_private_insert_policy" ON users_private
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id  -- User can only insert their own record
        OR is_admin()         -- Or user is admin
    );

-- UPDATE: Users can only update their own record
CREATE POLICY "users_private_update_policy" ON users_private
    FOR UPDATE
    USING (
        auth.uid() = user_id  -- User can only update their own record
        OR is_admin()         -- Or user is admin
    )
    WITH CHECK (
        auth.uid() = user_id  -- Ensure user_id doesn't change to someone else's
        OR is_admin()         -- Or user is admin
    );

-- DELETE: Users can only delete their own record
CREATE POLICY "users_private_delete_policy" ON users_private
    FOR DELETE
    USING (
        auth.uid() = user_id  -- User can only delete their own record
        OR is_admin()         -- Or user is admin
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
CREATE TRIGGER update_users_private_updated_at
    BEFORE UPDATE ON users_private
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE users_private IS 'Private user data accessible only to row owners and admins';
COMMENT ON COLUMN users_private.id IS 'Unique identifier for the private user record';
COMMENT ON COLUMN users_private.created_at IS 'When this private user record was created';
COMMENT ON COLUMN users_private.updated_at IS 'When this private user record was last modified (auto-updated)';
COMMENT ON COLUMN users_private.user_id IS 'References auth.users(id) - owner of this private record';

-- Grant necessary permissions
-- Note: RLS policies will control actual access, these grants enable the policies to work
GRANT ALL ON users_private TO authenticated;
-- No grant to anon since this table requires user ownership or admin status 