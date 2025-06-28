-- Migration: Create participation_gatherings table
-- Created: 2025-06-27 13:31:40
-- Description: Creates the participation_gatherings table with public read access and row owner write access

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the participation_gatherings table
CREATE TABLE IF NOT EXISTS public.participation_gatherings (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    user_id UUID NOT NULL REFERENCES auth.users(id),
    gathering_id UUID NOT NULL REFERENCES public.gatherings(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_participation_gatherings_user_id ON public.participation_gatherings(user_id);
CREATE INDEX IF NOT EXISTS idx_participation_gatherings_gathering_id ON public.participation_gatherings(gathering_id);

-- Enable Row Level Security
ALTER TABLE public.participation_gatherings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read A - Public Access
-- Anyone can read participation_gatherings data
CREATE POLICY "participation_gatherings_read_public" ON public.participation_gatherings
    FOR SELECT
    USING (true);

-- RLS Policy: Write C - Row Owners Only
-- Only the user who owns the row (or admins) can insert/update/delete
CREATE POLICY "participation_gatherings_insert_own" ON public.participation_gatherings
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR public.is_current_user_admin()
    );

CREATE POLICY "participation_gatherings_update_own" ON public.participation_gatherings
    FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR public.is_current_user_admin()
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR public.is_current_user_admin()
    );

CREATE POLICY "participation_gatherings_delete_own" ON public.participation_gatherings
    FOR DELETE
    USING (
        auth.uid() = user_id 
        OR public.is_current_user_admin()
    );

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
CREATE TRIGGER update_participation_gatherings_updated_at
    BEFORE UPDATE ON public.participation_gatherings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.participation_gatherings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.participation_gatherings TO authenticated; 