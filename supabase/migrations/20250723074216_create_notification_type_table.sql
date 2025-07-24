-- Migration: Create notification_type table
-- Date: 2025-01-23 07:42:16
-- Description: Creates notification_type table for storing notification type configurations
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

-- Create notification_type table
CREATE TABLE notification_type (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE
);

-- Create index for label field
CREATE INDEX idx_notification_type_label ON notification_type(label);

-- Enable Row Level Security
ALTER TABLE notification_type ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- READ PERMISSIONS: Public Access
-- Anyone can read this data (will be shown on open internet)
CREATE POLICY "Public read access for notification_type" ON notification_type
    FOR SELECT USING (true);

-- WRITE PERMISSIONS: Admins Only
-- Only app admins, Supabase admin, and app workflows can insert/update/delete

-- Insert policy - Admins only
CREATE POLICY "Admin insert access on notification_type" ON notification_type
    FOR INSERT 
    TO authenticated
    WITH CHECK (is_current_user_admin());

-- Update policy - Admins only  
CREATE POLICY "Admin update access on notification_type" ON notification_type
    FOR UPDATE
    TO authenticated
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- Delete policy - Admins only
CREATE POLICY "Admin delete access on notification_type" ON notification_type
    FOR DELETE
    TO authenticated
    USING (is_current_user_admin());

-- Service role access for app workflows (security definer functions, background jobs, triggers)
CREATE POLICY "Service role full access on notification_type" ON notification_type
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add trigger to automatically update updated_at field on record modification
CREATE TRIGGER notification_type_updated_at_trigger
    BEFORE UPDATE ON notification_type
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data rows
INSERT INTO notification_type (label) VALUES 
    ('email'),
    ('sms'), 
    ('push');

-- Add helpful comments
COMMENT ON TABLE notification_type IS 'Notification type lookup table for various notification channels throughout the application. Publicly readable but admin-controlled.';
COMMENT ON COLUMN notification_type.label IS 'Unique label for the notification type (e.g., email, sms, push)';
COMMENT ON INDEX idx_notification_type_label IS 'Index on label field for efficient lookups'; 