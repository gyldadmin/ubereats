-- Migration: Create gathering_idea_categories table
-- Purpose: Create lookup table for categorizing gathering ideas with public read and admin-only write access
-- Created: 2025-01-20 08:32:29

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

-- Create gathering_idea_categories table
CREATE TABLE gathering_idea_categories (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE
);

-- Create indexes for better query performance
CREATE INDEX idx_gathering_idea_categories_label ON gathering_idea_categories(label);

-- Enable Row Level Security
ALTER TABLE gathering_idea_categories ENABLE ROW LEVEL SECURITY;

-- Note: Using existing is_admin() function from foundation migration

-- RLS Policy: Public read access
-- Anyone can read gathering idea category data (will be shown on open internet)
CREATE POLICY "gathering_idea_categories_select_policy" ON gathering_idea_categories
    FOR SELECT
    USING (true);

-- RLS Policy: Admin-only write access
-- Only app admins, Supabase admin, and app workflows can insert records
CREATE POLICY "gathering_idea_categories_insert_policy" ON gathering_idea_categories
    FOR INSERT
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- RLS Policy: Admin-only update access
-- Only app admins, Supabase admin, and app workflows can update records
CREATE POLICY "gathering_idea_categories_update_policy" ON gathering_idea_categories
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
CREATE POLICY "gathering_idea_categories_delete_policy" ON gathering_idea_categories
    FOR DELETE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_gathering_idea_categories_updated_at
    BEFORE UPDATE ON gathering_idea_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data for gathering idea categories
INSERT INTO gathering_idea_categories (label) VALUES
    ('Using Photos'),
    ('Creative Rules'),
    ('Meaningful Food'),
    ('Special Dress'),
    ('Toasts and Sharing'),
    ('Sharing Interesting Things');

-- Grant appropriate permissions
GRANT SELECT ON gathering_idea_categories TO anon, authenticated;
GRANT ALL ON gathering_idea_categories TO service_role;

-- Add helpful comments to the table
COMMENT ON TABLE gathering_idea_categories IS 'Lookup table for categorizing gathering ideas with public read access and admin-only write access';
COMMENT ON COLUMN gathering_idea_categories.label IS 'Category label for gathering ideas (e.g., Using Photos, Creative Rules, etc.)';

-- Verification queries (commented out for production)
-- These can be uncommented during testing to verify the migration worked correctly

-- Check that the table was created successfully:
-- SELECT table_name, table_type FROM information_schema.tables WHERE table_name = 'gathering_idea_categories';

-- Check that all columns were created with proper constraints:
-- SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'gathering_idea_categories' ORDER BY ordinal_position;

-- Check that RLS is enabled:
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'gathering_idea_categories';

-- Check that indexes were created:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'gathering_idea_categories';

-- Check that seed data was inserted correctly:
-- SELECT COUNT(*) as total_categories, array_agg(label ORDER BY label) as category_labels FROM gathering_idea_categories; 