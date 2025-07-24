-- Migration: Create gathering_satellites table
-- Date: 2025-07-07 12:28:00 
-- Description: Creates gathering_satellites table that will be renamed to gathering_displays

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

-- Gathering satellites table (will be renamed to gathering_displays)
CREATE TABLE gathering_satellites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    gathering_id UUID UNIQUE REFERENCES gatherings(id) NOT NULL
);

-- Create indexes
CREATE INDEX idx_gathering_satellites_gathering_id ON gathering_satellites(gathering_id);

-- Add RLS
ALTER TABLE gathering_satellites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gathering_satellites table
-- Read: Public access for gathering display information
CREATE POLICY "Gathering satellites can be read by anyone" ON gathering_satellites
    FOR SELECT USING (true);

-- Write: Only admins can insert/update/delete 
CREATE POLICY "Gathering satellites can be modified by admins" ON gathering_satellites
    FOR ALL USING (public.is_admin());

-- Add trigger to update updated_at column
CREATE TRIGGER gathering_satellites_updated_at_trigger
    BEFORE UPDATE ON gathering_satellites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 