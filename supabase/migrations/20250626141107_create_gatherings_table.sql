-- Create gatherings table migration
-- This table stores public gathering/event information
-- Read: Public access (anyone can view)
-- Write: Active users only

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Simplified version without users_private table
-- Will require users_private table for full "active user" functionality

-- Create gatherings table
CREATE TABLE gatherings (
    -- Standard fields
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    title TEXT, -- gathering title
    address TEXT, -- street address
    start_time TIMESTAMPTZ, -- gathering start time
    end_time TIMESTAMPTZ, -- gathering end time
    image TEXT -- image URL or path
);

-- Enable Row Level Security
ALTER TABLE gatherings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Read A (Public Access) + Write B (Authenticated Users)
-- Note: Simplified to authenticated users instead of "active users" until users_private table exists

-- READ POLICY: Anyone can read gatherings (public access)
CREATE POLICY "gatherings_public_read" ON gatherings
    FOR SELECT 
    USING (true); -- No restrictions - anyone can read

-- WRITE POLICIES: Only authenticated users can insert/update/delete

-- INSERT POLICY: Authenticated users can create gatherings
CREATE POLICY "gatherings_authenticated_users_insert" ON gatherings
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- UPDATE POLICY: Authenticated users can update gatherings
CREATE POLICY "gatherings_authenticated_users_update" ON gatherings
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL
    )
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- DELETE POLICY: Authenticated users can delete gatherings
CREATE POLICY "gatherings_authenticated_users_delete" ON gatherings
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL
    );

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at on gatherings table
CREATE TRIGGER update_gatherings_updated_at
    BEFORE UPDATE ON gatherings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE gatherings IS 'Public gatherings/events that anyone can view but only authenticated users can manage';
COMMENT ON COLUMN gatherings.title IS 'The title/name of the gathering';
COMMENT ON COLUMN gatherings.address IS 'Street address where the gathering takes place';
COMMENT ON COLUMN gatherings.start_time IS 'When the gathering starts (with timezone)';
COMMENT ON COLUMN gatherings.end_time IS 'When the gathering ends (with timezone)';
COMMENT ON COLUMN gatherings.image IS 'URL or path to gathering image'; 