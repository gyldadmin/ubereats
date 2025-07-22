-- Migration: Create email table
-- Date: 2025-01-22 17:47:24
-- Description: Creates email table for storing email type configurations with label field
-- and admin-controlled content management with public read access

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

-- Create email table
CREATE TABLE email (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE
);

-- Create index for label field
CREATE INDEX idx_email_label ON email(label);

-- Add comments for documentation
COMMENT ON TABLE email IS 'Stores email type configurations and labels for email service management';
COMMENT ON COLUMN email.label IS 'Unique label identifier for different email types (invite, transactional, content, etc.)';

-- Create updated_at trigger
CREATE TRIGGER update_email_updated_at
    BEFORE UPDATE ON email
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE email ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "email_read_public" ON email
    FOR SELECT
    USING (true);

-- RLS Policy: WRITE D - Admins Only
-- Only app admins, Supabase admin, and app workflows can insert/update/delete
CREATE POLICY "email_write_admin_only" ON email
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
GRANT SELECT ON email TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON email TO authenticated;

-- Insert initial email type labels
INSERT INTO email (label) VALUES 
    ('invite'),
    ('transactional'),
    ('content'); 