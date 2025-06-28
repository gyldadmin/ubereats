-- Migration: Create neighborhoods table
-- Created: 2025-06-27 15:42:21
-- Description: Creates the neighborhoods table with public read access and admin-only write operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the neighborhoods table
CREATE TABLE IF NOT EXISTS public.neighborhoods (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL,                    -- Neighborhood label
    metro UUID REFERENCES public.metro(id) -- Reference to metro table
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_neighborhoods_label ON public.neighborhoods(label);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_metro ON public.neighborhoods(metro);

-- Enable Row Level Security
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read A - Public Access
-- Anyone can read neighborhoods data
CREATE POLICY "neighborhoods_read_public" ON public.neighborhoods
    FOR SELECT
    USING (true);

-- RLS Policy: Write D - Admins Only
-- Only admins can insert/update/delete neighborhoods data
CREATE POLICY "neighborhoods_insert_admin" ON public.neighborhoods
    FOR INSERT
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "neighborhoods_update_admin" ON public.neighborhoods
    FOR UPDATE
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "neighborhoods_delete_admin" ON public.neighborhoods
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
CREATE TRIGGER update_neighborhoods_updated_at
    BEFORE UPDATE ON public.neighborhoods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.neighborhoods TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.neighborhoods TO authenticated; 