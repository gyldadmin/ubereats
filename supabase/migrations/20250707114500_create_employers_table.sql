-- Migration: Create employers table
-- Date: 2025-07-07 11:45:00 
-- Description: Creates employers table that was missing from foundation schema

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

-- Employers table
CREATE TABLE employers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    name TEXT,
    li_url TEXT NOT NULL UNIQUE
);

-- Create indexes
CREATE INDEX idx_employers_li_url ON employers(li_url);
CREATE INDEX idx_employers_name ON employers(name);

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_employers_updated_at
    BEFORE UPDATE ON employers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access
CREATE POLICY "employers_select_policy" ON employers
    FOR SELECT
    USING (true);

-- RLS Policy: Admin-only write access
CREATE POLICY "employers_insert_policy" ON employers
    FOR INSERT
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "employers_update_policy" ON employers
    FOR UPDATE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "employers_delete_policy" ON employers
    FOR DELETE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- Grant appropriate permissions
GRANT SELECT ON employers TO anon, authenticated;
GRANT ALL ON employers TO service_role;

-- Add helpful comments to the table
COMMENT ON TABLE employers IS 'Employers lookup table with LinkedIn URLs for company identification';
COMMENT ON COLUMN employers.name IS 'Employer/company name';
COMMENT ON COLUMN employers.li_url IS 'LinkedIn company URL (unique identifier)'; 