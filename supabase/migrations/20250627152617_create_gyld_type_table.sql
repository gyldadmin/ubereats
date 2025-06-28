-- Migration: Create gyld_type table
-- Created: 2025-06-27 15:26:17
-- Description: Creates the gyld_type table with public read access and admin-only write operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the gyld_type table
CREATE TABLE IF NOT EXISTS public.gyld_type (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE,             -- Type label
    job TEXT,                               -- Job field (nullable)
    "@" TEXT                                -- @ field (nullable)
);

-- Create index on label for better query performance
CREATE INDEX IF NOT EXISTS idx_gyld_type_label ON public.gyld_type(label);

-- Enable Row Level Security
ALTER TABLE public.gyld_type ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read A - Public Access
-- Anyone can read gyld_type data
CREATE POLICY "gyld_type_read_public" ON public.gyld_type
    FOR SELECT
    USING (true);

-- RLS Policy: Write D - Admins Only
-- Only admins can insert/update/delete gyld_type data
CREATE POLICY "gyld_type_insert_admin" ON public.gyld_type
    FOR INSERT
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "gyld_type_update_admin" ON public.gyld_type
    FOR UPDATE
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "gyld_type_delete_admin" ON public.gyld_type
    FOR DELETE
    USING (public.is_current_user_admin());

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
CREATE TRIGGER update_gyld_type_updated_at
    BEFORE UPDATE ON public.gyld_type
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.gyld_type TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gyld_type TO authenticated;

-- Insert initial gyld_type data
INSERT INTO public.gyld_type (label) VALUES
    ('Product Management'),
    ('Growth')
ON CONFLICT (label) DO NOTHING; 