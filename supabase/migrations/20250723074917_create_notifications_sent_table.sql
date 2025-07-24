-- Migration: Create notifications_sent table
-- Date: 2025-01-23 07:49:17
-- Description: Creates notifications_sent table for tracking sent notifications
-- with active user read access and admin-only write access

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

-- Create notifications_sent table
CREATE TABLE notifications_sent (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    notification_type UUID REFERENCES notification_type(id),
    to_address TEXT[],
    body1 TEXT,
    subject TEXT,
    send_date TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_notifications_sent_notification_type ON notifications_sent(notification_type);
CREATE INDEX idx_notifications_sent_send_date ON notifications_sent(send_date);
CREATE INDEX idx_notifications_sent_to_address ON notifications_sent USING GIN(to_address);

-- Enable Row Level Security
ALTER TABLE notifications_sent ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- READ PERMISSIONS: Active Users Only (Read B)
-- Only active users can read this data
-- Active user definition: users_private.user_status = 'active' OR users_private.user_status = 'admin'
-- Plus: Supabase admin and app workflows can read

CREATE POLICY "Active users read access on notifications_sent" ON notifications_sent
    FOR SELECT 
    TO authenticated
    USING (is_current_user_active());

-- Service role read access for app workflows
CREATE POLICY "Service role read access on notifications_sent" ON notifications_sent
    FOR SELECT 
    TO service_role
    USING (true);

-- WRITE PERMISSIONS: Admins Only (Write D)
-- Only app admins, Supabase admin, and app workflows can insert/update/delete

-- Insert policy - Admins only
CREATE POLICY "Admin insert access on notifications_sent" ON notifications_sent
    FOR INSERT 
    TO authenticated
    WITH CHECK (is_current_user_admin());

-- Update policy - Admins only  
CREATE POLICY "Admin update access on notifications_sent" ON notifications_sent
    FOR UPDATE
    TO authenticated
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- Delete policy - Admins only
CREATE POLICY "Admin delete access on notifications_sent" ON notifications_sent
    FOR DELETE
    TO authenticated
    USING (is_current_user_admin());

-- Service role full write access for app workflows (security definer functions, background jobs, triggers)
CREATE POLICY "Service role write access on notifications_sent" ON notifications_sent
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add trigger to automatically update updated_at field on record modification
CREATE TRIGGER notifications_sent_updated_at_trigger
    BEFORE UPDATE ON notifications_sent
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE notifications_sent IS 'Tracking table for sent notifications across all channels (email, SMS, push). Read access for active users, write access for admins only.';
COMMENT ON COLUMN notifications_sent.notification_type IS 'Reference to notification_type table (email, sms, push, etc.)';
COMMENT ON COLUMN notifications_sent.to_address IS 'Array of recipient addresses (email addresses, phone numbers, device tokens, etc.)';
COMMENT ON COLUMN notifications_sent.body1 IS 'Main body content of the notification';
COMMENT ON COLUMN notifications_sent.subject IS 'Subject line for emails or title for push notifications';
COMMENT ON COLUMN notifications_sent.send_date IS 'Timestamp when the notification was actually sent';
COMMENT ON INDEX idx_notifications_sent_notification_type IS 'Index on notification_type for efficient filtering by notification channel';
COMMENT ON INDEX idx_notifications_sent_send_date IS 'Index on send_date for efficient date-based queries';
COMMENT ON INDEX idx_notifications_sent_to_address IS 'GIN index on to_address array for efficient recipient lookups'; 