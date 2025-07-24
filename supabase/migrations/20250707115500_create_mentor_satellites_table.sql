-- Migration: Create mentor_satellites table
-- Date: 2025-07-07 11:55:00 
-- Description: Creates mentor_satellites table that was missing from foundation schema

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

-- Mentor satellites table
CREATE TABLE mentor_satellites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    mentor_id UUID UNIQUE NOT NULL REFERENCES mentors(id)
);

-- Create indexes
CREATE INDEX idx_mentor_satellites_mentor_id ON mentor_satellites(mentor_id);

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_mentor_satellites_updated_at
    BEFORE UPDATE ON mentor_satellites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE mentor_satellites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access
CREATE POLICY "mentor_satellites_select_policy" ON mentor_satellites
    FOR SELECT
    USING (true);

-- RLS Policy: Admin-only write access
CREATE POLICY "mentor_satellites_insert_policy" ON mentor_satellites
    FOR INSERT
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "mentor_satellites_update_policy" ON mentor_satellites
    FOR UPDATE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "mentor_satellites_delete_policy" ON mentor_satellites
    FOR DELETE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- Grant appropriate permissions
GRANT SELECT ON mentor_satellites TO anon, authenticated;
GRANT ALL ON mentor_satellites TO service_role;

-- Add helpful comments to the table
COMMENT ON TABLE mentor_satellites IS 'Mentor satellites table storing additional mentor profile information';
COMMENT ON COLUMN mentor_satellites.mentor_id IS 'Reference to mentors table (unique, one satellite per mentor)'; 