-- Migration: Create gathering_ideas table
-- Purpose: Create table for storing gathering ideas with public read and admin-only write access
-- Created: 2025-01-20 08:40:12

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

-- Create gathering_ideas table
CREATE TABLE gathering_ideas (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE,
    overview TEXT,
    why TEXT,
    description_text TEXT,
    signup_text TEXT,
    experience_type UUID REFERENCES experience_type(id),
    gathering_idea_category UUID REFERENCES gathering_idea_categories(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_gathering_ideas_label ON gathering_ideas(label);
CREATE INDEX idx_gathering_ideas_experience_type ON gathering_ideas(experience_type);
CREATE INDEX idx_gathering_ideas_gathering_idea_category ON gathering_ideas(gathering_idea_category);

-- Enable Row Level Security
ALTER TABLE gathering_ideas ENABLE ROW LEVEL SECURITY;

-- Note: Using existing is_admin() function from foundation migration

-- RLS Policy: Public read access
-- Anyone can read gathering ideas data (will be shown on open internet)
CREATE POLICY "gathering_ideas_select_policy" ON gathering_ideas
    FOR SELECT
    USING (true);

-- RLS Policy: Admin-only write access
-- Only app admins, Supabase admin, and app workflows can insert records
CREATE POLICY "gathering_ideas_insert_policy" ON gathering_ideas
    FOR INSERT
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- RLS Policy: Admin-only update access
-- Only app admins, Supabase admin, and app workflows can update records
CREATE POLICY "gathering_ideas_update_policy" ON gathering_ideas
    FOR UPDATE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- RLS Policy: Admin-only delete access
-- Only app admins, Supabase admin, and app workflows can delete records
CREATE POLICY "gathering_ideas_delete_policy" ON gathering_ideas
    FOR DELETE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_gathering_ideas_updated_at
    BEFORE UPDATE ON gathering_ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant appropriate permissions
GRANT SELECT ON gathering_ideas TO anon, authenticated;
GRANT ALL ON gathering_ideas TO service_role;

-- Add helpful comments to the table
COMMENT ON TABLE gathering_ideas IS 'Table for storing gathering ideas with detailed descriptions and categorization, public read access and admin-only write access';
COMMENT ON COLUMN gathering_ideas.label IS 'Unique label/name for the gathering idea';
COMMENT ON COLUMN gathering_ideas.overview IS 'Overview description about the gathering idea';
COMMENT ON COLUMN gathering_ideas.why IS 'Explanation of why this gathering idea works well';
COMMENT ON COLUMN gathering_ideas.description_text IS 'Text content to be added to gathering descriptions';
COMMENT ON COLUMN gathering_ideas.signup_text IS 'Text content to be added to signup forms';
COMMENT ON COLUMN gathering_ideas.experience_type IS 'Reference to experience_type table - what type of gathering this idea applies to';
COMMENT ON COLUMN gathering_ideas.gathering_idea_category IS 'Reference to gathering_idea_categories table - category classification for this idea';

-- Verification queries (commented out for production)
-- These can be uncommented during testing to verify the migration worked correctly

-- Check that the table was created successfully:
-- SELECT table_name, table_type FROM information_schema.tables WHERE table_name = 'gathering_ideas';

-- Check that all columns were created with proper constraints:
-- SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'gathering_ideas' ORDER BY ordinal_position;

-- Check that foreign key constraints were created:
-- SELECT conname, contype, confrelid::regclass AS referenced_table FROM pg_constraint WHERE conrelid = 'gathering_ideas'::regclass AND contype = 'f';

-- Check that RLS is enabled:
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'gathering_ideas';

-- Check that indexes were created:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'gathering_ideas'; 