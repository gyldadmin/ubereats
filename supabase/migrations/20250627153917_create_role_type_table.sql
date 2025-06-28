-- Migration: Create role_type table
-- Created: 2025-06-27 15:39:17
-- Description: Creates the role_type table with public read access and admin-only write operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the role_type table
CREATE TABLE IF NOT EXISTS public.role_type (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE              -- Role type label
);

-- Create index on label for better query performance
CREATE INDEX IF NOT EXISTS idx_role_type_label ON public.role_type(label);

-- Enable Row Level Security
ALTER TABLE public.role_type ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read A - Public Access
-- Anyone can read role_type data
CREATE POLICY "role_type_read_public" ON public.role_type
    FOR SELECT
    USING (true);

-- RLS Policy: Write D - Admins Only
-- Only admins can insert/update/delete role_type data
CREATE POLICY "role_type_insert_admin" ON public.role_type
    FOR INSERT
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "role_type_update_admin" ON public.role_type
    FOR UPDATE
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "role_type_delete_admin" ON public.role_type
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
CREATE TRIGGER update_role_type_updated_at
    BEFORE UPDATE ON public.role_type
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.role_type TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.role_type TO authenticated;

-- Insert initial role_type data
INSERT INTO public.role_type (label) VALUES
    ('inductor'),
    ('salon host'),
    ('social host'),
    ('interviewer'),
    ('recruiter')
ON CONFLICT (label) DO NOTHING; 