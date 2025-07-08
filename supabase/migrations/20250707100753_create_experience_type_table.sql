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

-- Create experience_type table
CREATE TABLE experience_type (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE,
    category UUID REFERENCES gathering_category(id) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_experience_type_label ON experience_type(label);
CREATE INDEX idx_experience_type_category ON experience_type(category);

-- Enable Row Level Security
ALTER TABLE experience_type ENABLE ROW LEVEL SECURITY;

-- Note: Using existing is_admin() function from foundation migration

-- RLS Policy: Public read access
-- Anyone can read experience type data (will be shown on open internet)
CREATE POLICY "experience_type_select_policy" ON experience_type
    FOR SELECT
    USING (true);

-- RLS Policy: Admin-only write access
-- Only app admins, Supabase admin, and app workflows can insert records
CREATE POLICY "experience_type_insert_policy" ON experience_type
    FOR INSERT
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- RLS Policy: Admin-only update access
-- Only app admins, Supabase admin, and app workflows can update records
CREATE POLICY "experience_type_update_policy" ON experience_type
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
CREATE POLICY "experience_type_delete_policy" ON experience_type
    FOR DELETE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_experience_type_updated_at
    BEFORE UPDATE ON experience_type
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data for experience type labels
-- Learning-focused experience types
INSERT INTO experience_type (label, category) VALUES
    ('Mentoring', (SELECT id FROM gathering_category WHERE label = 'learning')),
    ('Course', (SELECT id FROM gathering_category WHERE label = 'learning')),
    ('Coaching', (SELECT id FROM gathering_category WHERE label = 'learning')),
    ('Podcast Club', (SELECT id FROM gathering_category WHERE label = 'learning'));

-- Social-focused experience types
INSERT INTO experience_type (label, category) VALUES
    ('Coworking', (SELECT id FROM gathering_category WHERE label = 'social')),
    ('Pro Bono', (SELECT id FROM gathering_category WHERE label = 'social')),
    ('Team', (SELECT id FROM gathering_category WHERE label = 'social')),
    ('Happy Hour', (SELECT id FROM gathering_category WHERE label = 'social')),
    ('Supper Club', (SELECT id FROM gathering_category WHERE label = 'social')),
    ('Outing', (SELECT id FROM gathering_category WHERE label = 'social')),
    ('Lunch', (SELECT id FROM gathering_category WHERE label = 'social')),
    ('Lottery', (SELECT id FROM gathering_category WHERE label = 'social'));

-- Grant appropriate permissions
GRANT SELECT ON experience_type TO anon, authenticated;
GRANT ALL ON experience_type TO service_role;

-- Add helpful comments to the table
COMMENT ON TABLE experience_type IS 'Lookup table for experience/gathering type labels with category classification, public read access and admin-only write access';
COMMENT ON COLUMN experience_type.label IS 'Experience type label (e.g., Mentoring, Course, Happy Hour, etc.)';
COMMENT ON COLUMN experience_type.category IS 'Foreign key reference to gathering_category table to classify the experience type'; 