-- Migration: Create participation_gatherings table
-- Date: 2025-07-07 12:06:00 
-- Description: Creates participation_gatherings table for tracking event RSVPs

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

-- Gathering participation table
CREATE TABLE participation_gatherings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    gathering_id UUID NOT NULL REFERENCES gatherings(id)
);

-- Create indexes for common queries
CREATE INDEX idx_participation_gatherings_user_id ON participation_gatherings(user_id);
CREATE INDEX idx_participation_gatherings_gathering_id ON participation_gatherings(gathering_id);

-- Create unique constraint to prevent duplicate participation
CREATE UNIQUE INDEX idx_participation_gatherings_user_gathering ON participation_gatherings(user_id, gathering_id);

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_participation_gatherings_updated_at
    BEFORE UPDATE ON participation_gatherings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE participation_gatherings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own participation records
CREATE POLICY "participation_gatherings_select_policy" ON participation_gatherings
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- RLS Policy: Users can manage their own participation
CREATE POLICY "participation_gatherings_insert_policy" ON participation_gatherings
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "participation_gatherings_update_policy" ON participation_gatherings
    FOR UPDATE
    USING (
        auth.uid() = user_id OR
        public.is_admin() OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        auth.uid() = user_id OR
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "participation_gatherings_delete_policy" ON participation_gatherings
    FOR DELETE
    USING (
        auth.uid() = user_id OR
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON participation_gatherings TO authenticated;
GRANT ALL ON participation_gatherings TO service_role;

-- Add helpful comments to the table
COMMENT ON TABLE participation_gatherings IS 'Tracks user participation/RSVPs for gatherings/events';
COMMENT ON COLUMN participation_gatherings.user_id IS 'User who is participating in the gathering';
COMMENT ON COLUMN participation_gatherings.gathering_id IS 'The gathering/event being participated in'; 