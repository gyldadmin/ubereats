-- Migration: Create gyld_type and gyld tables
-- Date: 2025-07-07 14:30:00 
-- Description: Creates gyld_type and gyld tables that were missing from foundation schema

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

-- Gyld types table
CREATE TABLE gyld_type (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    label TEXT NOT NULL UNIQUE,
    job TEXT,
    "@" TEXT
);

-- Main gyld/guild table
CREATE TABLE gyld (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL UNIQUE,
    metro UUID[],
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    gyld_type UUID REFERENCES gyld_type(id),
    organizer UUID[] DEFAULT '{}'
);

-- Create indexes
CREATE INDEX idx_gyld_type_label ON gyld_type(label);
CREATE INDEX idx_gyld_name ON gyld(name);
CREATE INDEX idx_gyld_user_id ON gyld(user_id);
CREATE INDEX idx_gyld_gyld_type ON gyld(gyld_type);

-- Add RLS to both tables
ALTER TABLE gyld_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyld ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gyld_type table
-- Read: Public access for gyld types
CREATE POLICY "Gyld types can be read by anyone" ON gyld_type
    FOR SELECT USING (true);

-- Write: Only admins can modify gyld types
CREATE POLICY "Gyld types can be modified by admins" ON gyld_type
    FOR ALL USING (public.is_admin());

-- RLS Policies for gyld table
-- Read: Public access for gyld information
CREATE POLICY "Gyld can be read by anyone" ON gyld
    FOR SELECT USING (true);

-- Write: Admins and gyld owners/organizers can modify
CREATE POLICY "Gyld can be modified by admins and owners" ON gyld
    FOR ALL USING (
        public.is_admin() OR 
        auth.uid() = user_id OR 
        auth.uid() = ANY(organizer)
    );

-- Add triggers to update updated_at columns
CREATE TRIGGER gyld_type_updated_at_trigger
    BEFORE UPDATE ON gyld_type
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER gyld_updated_at_trigger
    BEFORE UPDATE ON gyld
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 