-- Migration: Create nomination table
-- Created: 2025-06-27 13:15:18
-- Description: Creates the nomination table with public read access and row owner write access

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the nomination table
CREATE TABLE IF NOT EXISTS public.nomination (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    user_id UUID UNIQUE REFERENCES auth.users(id) NOT NULL
);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_nomination_user_id ON public.nomination(user_id);

-- Enable Row Level Security
ALTER TABLE public.nomination ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if current user is admin (needed for Write C permissions)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.users_internal 
        WHERE user_id = auth.uid() 
        AND user_status = 'admin'
    );
$$;

-- RLS Policy: Read A - Public Access
-- Anyone can read nomination data
CREATE POLICY "nomination_read_public" ON public.nomination
    FOR SELECT
    USING (true);

-- RLS Policy: Write C - Row Owners Only
-- Only the user who owns the row (or admins) can insert/update/delete
CREATE POLICY "nomination_insert_own" ON public.nomination
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR public.is_current_user_admin()
    );

CREATE POLICY "nomination_update_own" ON public.nomination
    FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR public.is_current_user_admin()
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR public.is_current_user_admin()
    );

CREATE POLICY "nomination_delete_own" ON public.nomination
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
CREATE TRIGGER update_nomination_updated_at
    BEFORE UPDATE ON public.nomination
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.nomination TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.nomination TO authenticated; 