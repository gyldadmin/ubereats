-- Migration: Create mentors table
-- Created: 2025-06-27 13:27:39
-- Description: Creates the mentors table with full public access for both read and write operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the mentors table
CREATE TABLE IF NOT EXISTS public.mentors (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    user_id UUID UNIQUE REFERENCES auth.users(id) NOT NULL
);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_mentors_user_id ON public.mentors(user_id);

-- Enable Row Level Security
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read A - Public Access
-- Anyone can read mentors data
CREATE POLICY "mentors_read_public" ON public.mentors
    FOR SELECT
    USING (true);

-- RLS Policy: Write A - Public Access
-- Anyone can insert/update/delete mentors data
CREATE POLICY "mentors_insert_public" ON public.mentors
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "mentors_update_public" ON public.mentors
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "mentors_delete_public" ON public.mentors
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
CREATE TRIGGER update_mentors_updated_at
    BEFORE UPDATE ON public.mentors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.mentors TO anon, authenticated; 