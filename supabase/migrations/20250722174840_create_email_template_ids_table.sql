-- Migration: Create email_template_ids table
-- Date: 2025-01-22 17:48:40
-- Description: Creates email_template_ids table for storing email template identifier configurations
-- with label field and admin-controlled content management with public read access

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create email_template_ids table
CREATE TABLE email_template_ids (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE
);

-- Create index for label field
CREATE INDEX idx_email_template_ids_label ON email_template_ids(label);

-- Add comments for documentation
COMMENT ON TABLE email_template_ids IS 'Stores email template identifiers and labels for mapping template names to provider-specific template IDs';
COMMENT ON COLUMN email_template_ids.label IS 'Unique label identifier for different email template types (basic, basic_with_button, invite, text-only, etc.)';

-- Create updated_at trigger
CREATE TRIGGER update_email_template_ids_updated_at
    BEFORE UPDATE ON email_template_ids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE email_template_ids ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin status if it doesn't exist
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users_private 
        WHERE user_id = auth.uid() 
        AND user_status = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy: READ A - Public Access
-- Anyone can read this data (will be shown on open internet)
CREATE POLICY "email_template_ids_read_public" ON email_template_ids
    FOR SELECT
    USING (true);

-- RLS Policy: WRITE D - Admins Only
-- Only app admins, Supabase admin, and app workflows can insert/update/delete
CREATE POLICY "email_template_ids_write_admin_only" ON email_template_ids
    FOR ALL
    USING (
        -- Allow if user is admin
        is_admin_user()
        -- Service role and workflows are automatically allowed due to security definer context
    )
    WITH CHECK (
        -- Same condition for inserts/updates
        is_admin_user()
    );

-- Grant necessary permissions
GRANT SELECT ON email_template_ids TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON email_template_ids TO authenticated;

-- Insert initial email template identifier labels
INSERT INTO email_template_ids (label) VALUES 
    ('basic'),
    ('basic_with_button'),
    ('invite'),
    ('text-only'); 