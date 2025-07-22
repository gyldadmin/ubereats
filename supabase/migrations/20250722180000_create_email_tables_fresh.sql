-- Migration: Create email and email_template_ids tables
-- Date: 2025-01-22 18:00:00
-- Description: Creates both email tables for email service configuration

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create email table
CREATE TABLE IF NOT EXISTS email (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE
);

-- Create email_template_ids table
CREATE TABLE IF NOT EXISTS email_template_ids (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_label ON email(label);
CREATE INDEX IF NOT EXISTS idx_email_template_ids_label ON email_template_ids(label);

-- Add comments for documentation
COMMENT ON TABLE email IS 'Stores email type configurations and labels for email service management';
COMMENT ON COLUMN email.label IS 'Unique label identifier for different email types (invite, transactional, content, etc.)';
COMMENT ON TABLE email_template_ids IS 'Stores email template identifiers and labels for mapping template names to provider-specific template IDs';
COMMENT ON COLUMN email_template_ids.label IS 'Unique label identifier for different email template types (basic, basic_with_button, invite, text-only, etc.)';

-- Create updated_at triggers
CREATE TRIGGER update_email_updated_at
    BEFORE UPDATE ON email
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_template_ids_updated_at
    BEFORE UPDATE ON email_template_ids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE email ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_ids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email table
CREATE POLICY "email_read_public" ON email FOR SELECT USING (true);
CREATE POLICY "email_write_admin_only" ON email FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

-- RLS Policies for email_template_ids table  
CREATE POLICY "email_template_ids_read_public" ON email_template_ids FOR SELECT USING (true);
CREATE POLICY "email_template_ids_write_admin_only" ON email_template_ids FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

-- Grant permissions
GRANT SELECT ON email TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON email TO authenticated;
GRANT SELECT ON email_template_ids TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON email_template_ids TO authenticated;

-- Insert initial data
INSERT INTO email (label) VALUES 
    ('invite'),
    ('transactional'),
    ('content')
ON CONFLICT (label) DO NOTHING;

INSERT INTO email_template_ids (label) VALUES 
    ('basic'),
    ('basic_with_button'),
    ('invite'),
    ('text-only')
ON CONFLICT (label) DO NOTHING; 