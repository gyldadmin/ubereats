-- Migration: Create potluck table
-- Description: Table for tracking potluck contributions for gatherings
-- Created: 2025-07-12 11:44:13
-- RLS Policy: READ A (Public Access) + WRITE A (Public Access)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create potluck table
CREATE TABLE IF NOT EXISTS potluck (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gathering_id UUID NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
    contribution TEXT -- food contribution description
);

-- Create indexes for foreign key relationships
CREATE INDEX IF NOT EXISTS potluck_user_id_idx ON potluck(user_id);
CREATE INDEX IF NOT EXISTS potluck_gathering_id_idx ON potluck(gathering_id);

-- Enable Row Level Security
ALTER TABLE potluck ENABLE ROW LEVEL SECURITY;

-- RLS Policies: READ A (Public Access) + WRITE A (Public Access)
-- Anyone can read this data (will be shown on open internet)
CREATE POLICY "potluck_read_public" ON potluck
    FOR SELECT
    USING (true);

-- Anyone can insert/update/delete (open internet access)
CREATE POLICY "potluck_insert_public" ON potluck
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "potluck_update_public" ON potluck
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "potluck_delete_public" ON potluck
    FOR DELETE
    USING (true);

-- Create or replace updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at field on record modification
CREATE TRIGGER update_potluck_updated_at
    BEFORE UPDATE ON potluck
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE potluck IS 'Table for tracking potluck food contributions for gatherings';
COMMENT ON COLUMN potluck.user_id IS 'Owner/contributor of this potluck item';
COMMENT ON COLUMN potluck.gathering_id IS 'Gathering this potluck contribution is for';
COMMENT ON COLUMN potluck.contribution IS 'Description of the food item being contributed'; 