-- Migration: Create gyld table
-- Created: 2025-06-27 15:44:53
-- Description: Creates the gyld table with public read access and row owner write operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the gyld table
CREATE TABLE IF NOT EXISTS public.gyld (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    name TEXT NOT NULL UNIQUE,              -- Name of guild
    metro UUID[],                           -- Array of metro IDs
    user_id UUID REFERENCES auth.users(id) NOT NULL -- Owner of the gyld
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gyld_name ON public.gyld(name);
CREATE INDEX IF NOT EXISTS idx_gyld_metro ON public.gyld USING GIN(metro);
CREATE INDEX IF NOT EXISTS idx_gyld_user_id ON public.gyld(user_id);

-- Enable Row Level Security
ALTER TABLE public.gyld ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users_private 
        WHERE user_id = auth.uid() 
        AND user_status = 'admin'
    );
END;
$$;

-- RLS Policy: Read A - Public Access
-- Anyone can read gyld data
CREATE POLICY "gyld_read_public" ON public.gyld
    FOR SELECT
    USING (true);

-- RLS Policy: Write C - Row Owners Only
-- Only row owners and admins can insert/update/delete gyld data
CREATE POLICY "gyld_insert_owner" ON public.gyld
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_current_user_admin());

CREATE POLICY "gyld_update_owner" ON public.gyld
    FOR UPDATE
    USING (auth.uid() = user_id OR public.is_current_user_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_current_user_admin());

CREATE POLICY "gyld_delete_owner" ON public.gyld
    FOR DELETE
    USING (auth.uid() = user_id OR public.is_current_user_admin());

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
CREATE TRIGGER update_gyld_updated_at
    BEFORE UPDATE ON public.gyld
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.gyld TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gyld TO authenticated; 