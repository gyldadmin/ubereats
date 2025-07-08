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

-- Create gathering_status table
CREATE TABLE gathering_status (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE
);

-- Create index on label field for better query performance
CREATE INDEX idx_gathering_status_label ON gathering_status(label);

-- Enable Row Level Security
ALTER TABLE gathering_status ENABLE ROW LEVEL SECURITY;

-- Note: Using existing is_admin() function from foundation migration

-- RLS Policy: Public read access
-- Anyone can read gathering status data (will be shown on open internet)
CREATE POLICY "gathering_status_select_policy" ON gathering_status
    FOR SELECT
    USING (true);

-- RLS Policy: Admin-only write access
-- Only app admins, Supabase admin, and app workflows can insert records
CREATE POLICY "gathering_status_insert_policy" ON gathering_status
    FOR INSERT
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- RLS Policy: Admin-only update access
-- Only app admins, Supabase admin, and app workflows can update records
CREATE POLICY "gathering_status_update_policy" ON gathering_status
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
CREATE POLICY "gathering_status_delete_policy" ON gathering_status
    FOR DELETE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_gathering_status_updated_at
    BEFORE UPDATE ON gathering_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data for gathering status labels
INSERT INTO gathering_status (label) VALUES
    ('unsaved'),
    ('pre-launch'),
    ('launched'),
    ('cancelled'),
    ('finished');

-- Grant appropriate permissions
GRANT SELECT ON gathering_status TO anon, authenticated;
GRANT ALL ON gathering_status TO service_role;

-- Add helpful comment to the table
COMMENT ON TABLE gathering_status IS 'Lookup table for gathering/event status labels with public read access and admin-only write access';
COMMENT ON COLUMN gathering_status.label IS 'Status label for gatherings (e.g., unsaved, pre-launch, launched, cancelled, finished)'; 