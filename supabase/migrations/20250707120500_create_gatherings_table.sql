-- Migration: Create gatherings table
-- Date: 2025-07-07 12:05:00 
-- Description: Creates gatherings table that was missing from foundation schema

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

-- Gatherings/events table
CREATE TABLE gatherings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    title TEXT,
    address TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    image TEXT
);

-- Create indexes for common queries
CREATE INDEX idx_gatherings_start_time ON gatherings(start_time);
CREATE INDEX idx_gatherings_title ON gatherings(title);

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_gatherings_updated_at
    BEFORE UPDATE ON gatherings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE gatherings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access
CREATE POLICY "gatherings_select_policy" ON gatherings
    FOR SELECT
    USING (true);

-- RLS Policy: Admin-only write access
CREATE POLICY "gatherings_insert_policy" ON gatherings
    FOR INSERT
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "gatherings_update_policy" ON gatherings
    FOR UPDATE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "gatherings_delete_policy" ON gatherings
    FOR DELETE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- Grant appropriate permissions
GRANT SELECT ON gatherings TO anon, authenticated;
GRANT ALL ON gatherings TO service_role;

-- Add helpful comments to the table
COMMENT ON TABLE gatherings IS 'Main gatherings/events table storing event information';
COMMENT ON COLUMN gatherings.title IS 'Event title';
COMMENT ON COLUMN gatherings.start_time IS 'Event start time with timezone';
COMMENT ON COLUMN gatherings.end_time IS 'Event end time with timezone'; 