-- Migration: Create candidates table
-- Date: 2025-07-07 12:10:00 
-- Description: Creates candidates table that was missing from foundation schema

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

-- Candidates table
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID UNIQUE REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_candidates_user_id ON candidates(user_id);

-- Add RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for candidates table
-- Read: Admin users and the user themselves can read candidate records
CREATE POLICY "Candidates can be read by admins and self" ON candidates
    FOR SELECT USING (
        public.is_admin() OR 
        auth.uid() = user_id
    );

-- Write: Only admins can insert/update/delete candidate records
CREATE POLICY "Candidates can be modified by admins" ON candidates
    FOR ALL USING (public.is_admin());

-- Add trigger to update updated_at column
CREATE TRIGGER candidates_updated_at_trigger
    BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 