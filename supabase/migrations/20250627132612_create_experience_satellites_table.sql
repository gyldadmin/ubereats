-- Migration: Create experience_satellites table
-- Created: 2025-06-27 13:26:12
-- Description: Creates the experience_satellites table with full public access for both read and write operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the experience_satellites table
CREATE TABLE IF NOT EXISTS public.experience_satellites (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    experience_id UUID UNIQUE REFERENCES public.experiences(id) NOT NULL
);

-- Create index on experience_id for better query performance
CREATE INDEX IF NOT EXISTS idx_experience_satellites_experience_id ON public.experience_satellites(experience_id);

-- Enable Row Level Security
ALTER TABLE public.experience_satellites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read A - Public Access
-- Anyone can read experience_satellites data
CREATE POLICY "experience_satellites_read_public" ON public.experience_satellites
    FOR SELECT
    USING (true);

-- RLS Policy: Write A - Public Access
-- Anyone can insert/update/delete experience_satellites data
CREATE POLICY "experience_satellites_insert_public" ON public.experience_satellites
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "experience_satellites_update_public" ON public.experience_satellites
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "experience_satellites_delete_public" ON public.experience_satellites
    FOR DELETE
    USING (true);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_experience_satellites_updated_at
    BEFORE UPDATE ON public.experience_satellites
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.experience_satellites TO anon, authenticated; 