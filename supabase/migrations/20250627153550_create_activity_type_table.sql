-- Migration: Create activity_type table
-- Created: 2025-06-27 15:35:50
-- Description: Creates the activity_type table with public read access and admin-only write operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the activity_type table
CREATE TABLE IF NOT EXISTS public.activity_type (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE              -- Activity type label
);

-- Create index on label for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_type_label ON public.activity_type(label);

-- Enable Row Level Security
ALTER TABLE public.activity_type ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read A - Public Access
-- Anyone can read activity_type data
CREATE POLICY "activity_type_read_public" ON public.activity_type
    FOR SELECT
    USING (true);

-- RLS Policy: Write D - Admins Only
-- Only admins can insert/update/delete activity_type data
CREATE POLICY "activity_type_insert_admin" ON public.activity_type
    FOR INSERT
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "activity_type_update_admin" ON public.activity_type
    FOR UPDATE
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "activity_type_delete_admin" ON public.activity_type
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
CREATE TRIGGER update_activity_type_updated_at
    BEFORE UPDATE ON public.activity_type
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.activity_type TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.activity_type TO authenticated;

-- Insert initial activity_type data
INSERT INTO public.activity_type (label) VALUES
    ('Pro Bono Project'),
    ('Happy Hour'),
    ('Team'),
    ('Podcast Club'),
    ('Salon'),
    ('Course'),
    ('Coaching')
ON CONFLICT (label) DO NOTHING; 