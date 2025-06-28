-- Migration: Create mentor_satellites table
-- Created: 2025-06-27 13:29:00
-- Description: Creates the mentor_satellites table with full public access for both read and write operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the mentor_satellites table
CREATE TABLE IF NOT EXISTS public.mentor_satellites (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    mentor_id UUID UNIQUE NOT NULL REFERENCES public.mentors(id)
);

-- Create index on mentor_id for better query performance
CREATE INDEX IF NOT EXISTS idx_mentor_satellites_mentor_id ON public.mentor_satellites(mentor_id);

-- Enable Row Level Security
ALTER TABLE public.mentor_satellites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read A - Public Access
-- Anyone can read mentor_satellites data
CREATE POLICY "mentor_satellites_read_public" ON public.mentor_satellites
    FOR SELECT
    USING (true);

-- RLS Policy: Write A - Public Access
-- Anyone can insert/update/delete mentor_satellites data
CREATE POLICY "mentor_satellites_insert_public" ON public.mentor_satellites
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "mentor_satellites_update_public" ON public.mentor_satellites
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "mentor_satellites_delete_public" ON public.mentor_satellites
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
CREATE TRIGGER update_mentor_satellites_updated_at
    BEFORE UPDATE ON public.mentor_satellites
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.mentor_satellites TO anon, authenticated; 