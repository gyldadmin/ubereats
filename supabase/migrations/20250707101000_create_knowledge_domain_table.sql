-- Migration: Create knowledge_domain table
-- Date: 2025-07-07 10:10:00 
-- Description: Creates knowledge_domain table that was missing from foundation schema

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

-- Knowledge domains table
CREATE TABLE knowledge_domain (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    label TEXT NOT NULL UNIQUE
);

-- Create index on label field
CREATE INDEX idx_knowledge_domain_label ON knowledge_domain(label);

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_knowledge_domain_updated_at
    BEFORE UPDATE ON knowledge_domain
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE knowledge_domain ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access
CREATE POLICY "knowledge_domain_select_policy" ON knowledge_domain
    FOR SELECT
    USING (true);

-- RLS Policy: Admin-only write access
CREATE POLICY "knowledge_domain_insert_policy" ON knowledge_domain
    FOR INSERT
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "knowledge_domain_update_policy" ON knowledge_domain
    FOR UPDATE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "knowledge_domain_delete_policy" ON knowledge_domain
    FOR DELETE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- Grant appropriate permissions
GRANT SELECT ON knowledge_domain TO anon, authenticated;
GRANT ALL ON knowledge_domain TO service_role;

-- Add helpful comment to the table
COMMENT ON TABLE knowledge_domain IS 'Lookup table for knowledge domain categories with public read access and admin-only write access';
COMMENT ON COLUMN knowledge_domain.label IS 'Knowledge domain label (e.g., Product Practice, Growth, etc.)'; 