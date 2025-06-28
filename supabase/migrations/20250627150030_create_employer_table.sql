-- Migration: Create employer table
-- Created: 2025-06-27 15:00:30
-- Description: Creates the employer table with full public access for both read and write operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the employer table
CREATE TABLE IF NOT EXISTS public.employer (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    name TEXT,                              -- Employer name (nullable)
    li_url TEXT NOT NULL UNIQUE             -- LinkedIn URL without https://www.
);

-- Create index on li_url for better query performance (already unique, but helps with lookups)
CREATE INDEX IF NOT EXISTS idx_employer_li_url ON public.employer(li_url);

-- Enable Row Level Security
ALTER TABLE public.employer ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read A - Public Access
-- Anyone can read employer data
CREATE POLICY "employer_read_public" ON public.employer
    FOR SELECT
    USING (true);

-- RLS Policy: Write A - Public Access
-- Anyone can insert/update/delete employer data
CREATE POLICY "employer_insert_public" ON public.employer
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "employer_update_public" ON public.employer
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "employer_delete_public" ON public.employer
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
CREATE TRIGGER update_employer_updated_at
    BEFORE UPDATE ON public.employer
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.employer TO anon, authenticated; 