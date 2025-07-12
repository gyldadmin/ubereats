-- Migration: Create content_templates table
-- Date: 2025-07-11 16:48:19
-- Description: Creates content_templates table for storing email, push, SMS, and display templates
-- with dynamic variables support and admin-controlled content management

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

-- Create content_templates table
CREATE TABLE content_templates (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    content_key TEXT UNIQUE NOT NULL,
    content_type TEXT NOT NULL, -- email, push, SMS, display
    usage_context TEXT,
    dynamic_variables JSONB DEFAULT '[]', -- list of dynamic references or none
    primary_text TEXT,
    secondary_text TEXT,
    tertiary_text TEXT
);

-- Add comments for documentation
COMMENT ON TABLE content_templates IS 'Stores content templates for emails, push notifications, SMS, and display content with dynamic variable support';
COMMENT ON COLUMN content_templates.content_key IS 'Unique identifier for the content template';
COMMENT ON COLUMN content_templates.content_type IS 'Type of content: email, push, SMS, or display';
COMMENT ON COLUMN content_templates.usage_context IS 'Description of when and how this template is used';
COMMENT ON COLUMN content_templates.dynamic_variables IS 'Array of dynamic variable names that can be replaced in the template';
COMMENT ON COLUMN content_templates.primary_text IS 'Main text content of the template';
COMMENT ON COLUMN content_templates.secondary_text IS 'Secondary text content (subtitle, description, etc.)';
COMMENT ON COLUMN content_templates.tertiary_text IS 'Additional text content (footer, disclaimer, etc.)';

-- Create updated_at trigger
CREATE TRIGGER update_content_templates_updated_at
    BEFORE UPDATE ON content_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin status
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
CREATE POLICY "content_templates_read_public" ON content_templates
    FOR SELECT
    USING (true);

-- RLS Policy: WRITE D - Admins Only
-- Only app admins, Supabase admin, and app workflows can insert/update/delete
CREATE POLICY "content_templates_write_admin_only" ON content_templates
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
GRANT SELECT ON content_templates TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON content_templates TO authenticated; 