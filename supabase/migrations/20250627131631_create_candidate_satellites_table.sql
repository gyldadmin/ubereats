-- Migration: Create candidate_satellites table
-- Created: 2025-06-27 13:16:31
-- Description: Creates the candidate_satellites table with public read access and row owner write access
-- Note: Row ownership is determined by the user who owns the referenced candidate record

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the candidate_satellites table
CREATE TABLE IF NOT EXISTS public.candidate_satellites (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    candidate_id UUID UNIQUE REFERENCES public.candidates(id) NOT NULL
);

-- Create index on candidate_id for better query performance
CREATE INDEX IF NOT EXISTS idx_candidate_satellites_candidate_id ON public.candidate_satellites(candidate_id);

-- Enable Row Level Security
ALTER TABLE public.candidate_satellites ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user owns the candidate record
CREATE OR REPLACE FUNCTION public.owns_candidate(candidate_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.candidates 
        WHERE id = candidate_uuid 
        AND user_id = auth.uid()
    );
$$;

-- RLS Policy: Read A - Public Access
-- Anyone can read candidate_satellites data
CREATE POLICY "candidate_satellites_read_public" ON public.candidate_satellites
    FOR SELECT
    USING (true);

-- RLS Policy: Write C - Row Owners Only
-- Only the user who owns the referenced candidate (or admins) can insert/update/delete
CREATE POLICY "candidate_satellites_insert_own" ON public.candidate_satellites
    FOR INSERT
    WITH CHECK (
        public.owns_candidate(candidate_id)
        OR public.is_current_user_admin()
    );

CREATE POLICY "candidate_satellites_update_own" ON public.candidate_satellites
    FOR UPDATE
    USING (
        public.owns_candidate(candidate_id)
        OR public.is_current_user_admin()
    )
    WITH CHECK (
        public.owns_candidate(candidate_id)
        OR public.is_current_user_admin()
    );

CREATE POLICY "candidate_satellites_delete_own" ON public.candidate_satellites
    FOR DELETE
    USING (
        public.owns_candidate(candidate_id)
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
CREATE TRIGGER update_candidate_satellites_updated_at
    BEFORE UPDATE ON public.candidate_satellites
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.candidate_satellites TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.candidate_satellites TO authenticated; 