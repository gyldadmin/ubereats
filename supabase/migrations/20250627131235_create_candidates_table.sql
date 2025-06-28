-- Migration: Create candidates table
-- Created: 2025-01-27 13:12:35
-- Description: Candidates table with public read access, row owner write access

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create candidates table
CREATE TABLE candidates (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    user_id UUID UNIQUE REFERENCES auth.users(id)
);

-- Create index on user_id for performance
CREATE INDEX idx_candidates_user_id ON candidates(user_id);

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "candidates_read_policy" ON candidates
    FOR SELECT
    USING (true); -- Public access - anyone can read

-- WRITE POLICIES: Row Owners Only + Admins (Write C)

-- INSERT: Users can only create their own candidate record
CREATE POLICY "candidates_insert_policy" ON candidates
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id  -- User can only insert their own record
        OR is_admin()         -- Or user is admin
    );

-- UPDATE: Users can only update their own candidate record
CREATE POLICY "candidates_update_policy" ON candidates
    FOR UPDATE
    USING (
        auth.uid() = user_id  -- User can only update their own record
        OR is_admin()         -- Or user is admin
    )
    WITH CHECK (
        auth.uid() = user_id  -- Ensure user_id doesn't change to someone else's
        OR is_admin()         -- Or user is admin
    );

-- DELETE: Users can only delete their own candidate record
CREATE POLICY "candidates_delete_policy" ON candidates
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
CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE candidates IS 'Candidates table with public read access, row owner write access';
COMMENT ON COLUMN candidates.id IS 'Unique identifier for the candidate record';
COMMENT ON COLUMN candidates.created_at IS 'When this candidate record was created';
COMMENT ON COLUMN candidates.updated_at IS 'When this candidate record was last modified (auto-updated)';
COMMENT ON COLUMN candidates.user_id IS 'References auth.users(id) - the user who is a candidate';

-- Grant necessary permissions
-- Note: RLS policies will control actual access, these grants enable the policies to work
GRANT ALL ON candidates TO authenticated;
GRANT SELECT ON candidates TO anon; -- Allow anonymous users to read (public access) 