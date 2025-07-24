-- Migration: Create mentors table
-- Date: 2025-07-07 11:40:00 
-- Description: Creates mentors table that was missing from foundation schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mentors table
CREATE TABLE mentors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID UNIQUE REFERENCES auth.users(id)  -- Made nullable since we marked migration 20250121131500 as applied
);

-- Create indexes
CREATE INDEX idx_mentors_user_id ON mentors(user_id);

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_mentors_updated_at
    BEFORE UPDATE ON mentors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access
CREATE POLICY "mentors_select_policy" ON mentors
    FOR SELECT
    USING (true);

-- RLS Policy: Admin-only write access
CREATE POLICY "mentors_insert_policy" ON mentors
    FOR INSERT
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "mentors_update_policy" ON mentors
    FOR UPDATE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "mentors_delete_policy" ON mentors
    FOR DELETE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- Grant appropriate permissions
GRANT SELECT ON mentors TO anon, authenticated;
GRANT ALL ON mentors TO service_role;

-- Add helpful comment to the table
COMMENT ON TABLE mentors IS 'Mentors table storing mentor information and references';
COMMENT ON COLUMN mentors.user_id IS 'Reference to auth.users table - nullable to allow mentors without user accounts'; 