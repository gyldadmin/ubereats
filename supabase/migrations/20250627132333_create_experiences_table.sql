-- Migration: Create experiences table
-- Created: 2025-06-27 13:23:33
-- Description: Creates the experiences table with full public access for both read and write operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the experiences table
CREATE TABLE IF NOT EXISTS public.experiences (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read A - Public Access
-- Anyone can read experiences data
CREATE POLICY "experiences_read_public" ON public.experiences
    FOR SELECT
    USING (true);

-- RLS Policy: Write A - Public Access
-- Anyone can insert/update/delete experiences data
CREATE POLICY "experiences_insert_public" ON public.experiences
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "experiences_update_public" ON public.experiences
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "experiences_delete_public" ON public.experiences
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
CREATE TRIGGER update_experiences_updated_at
    BEFORE UPDATE ON public.experiences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.experiences TO anon, authenticated; 