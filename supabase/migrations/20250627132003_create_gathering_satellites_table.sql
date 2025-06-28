-- Migration: Create gathering_satellites table
-- Created: 2025-06-27 13:20:03
-- Description: Creates the gathering_satellites table with public read access and active user write access

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the gathering_satellites table
CREATE TABLE IF NOT EXISTS public.gathering_satellites (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    gathering_id UUID UNIQUE REFERENCES public.gatherings(id) NOT NULL
);

-- Create index on gathering_id for better query performance
CREATE INDEX IF NOT EXISTS idx_gathering_satellites_gathering_id ON public.gathering_satellites(gathering_id);

-- Enable Row Level Security
ALTER TABLE public.gathering_satellites ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if current user is active (needed for Write B permissions)
CREATE OR REPLACE FUNCTION public.is_current_user_active()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.users_internal 
        WHERE user_id = auth.uid() 
        AND (user_status = 'active' OR user_status = 'admin')
    );
$$;

-- RLS Policy: Read A - Public Access
-- Anyone can read gathering_satellites data
CREATE POLICY "gathering_satellites_read_public" ON public.gathering_satellites
    FOR SELECT
    USING (true);

-- RLS Policy: Write B - Active Users
-- Only active users (or admins) can insert/update/delete
CREATE POLICY "gathering_satellites_insert_active" ON public.gathering_satellites
    FOR INSERT
    WITH CHECK (public.is_current_user_active());

CREATE POLICY "gathering_satellites_update_active" ON public.gathering_satellites
    FOR UPDATE
    USING (public.is_current_user_active())
    WITH CHECK (public.is_current_user_active());

CREATE POLICY "gathering_satellites_delete_active" ON public.gathering_satellites
    FOR DELETE
    USING (public.is_current_user_active());

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
CREATE TRIGGER update_gathering_satellites_updated_at
    BEFORE UPDATE ON public.gathering_satellites
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.gathering_satellites TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gathering_satellites TO authenticated; 