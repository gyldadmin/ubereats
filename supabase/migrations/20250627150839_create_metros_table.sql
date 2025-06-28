-- Migration: Create metros table
-- Created: 2025-06-27 15:08:39
-- Description: Creates the metros table with public read access and admin-only write operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the metros table
CREATE TABLE IF NOT EXISTS public.metros (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE              -- Metro name
);

-- Create index on label for better query performance
CREATE INDEX IF NOT EXISTS idx_metros_label ON public.metros(label);

-- Enable Row Level Security
ALTER TABLE public.metros ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read A - Public Access
-- Anyone can read metros data
CREATE POLICY "metros_read_public" ON public.metros
    FOR SELECT
    USING (true);

-- RLS Policy: Write D - Admins Only
-- Only admins can insert/update/delete metros data
CREATE POLICY "metros_insert_admin" ON public.metros
    FOR INSERT
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "metros_update_admin" ON public.metros
    FOR UPDATE
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "metros_delete_admin" ON public.metros
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
CREATE TRIGGER update_metros_updated_at
    BEFORE UPDATE ON public.metros
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.metros TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.metros TO authenticated;

-- Insert initial metro data
INSERT INTO public.metros (label) VALUES
    ('Boston'),
    ('Seattle'),
    ('NYC'),
    ('Austin'),
    ('DC'),
    ('Chicago')
ON CONFLICT (label) DO NOTHING; 