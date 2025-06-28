-- Migration: Create knowledge_domain table
-- Created: 2025-06-27 15:37:39
-- Description: Creates the knowledge_domain table with public read access and admin-only write operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the knowledge_domain table
CREATE TABLE IF NOT EXISTS public.knowledge_domain (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE              -- Knowledge domain label
);

-- Create index on label for better query performance
CREATE INDEX IF NOT EXISTS idx_knowledge_domain_label ON public.knowledge_domain(label);

-- Enable Row Level Security
ALTER TABLE public.knowledge_domain ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read A - Public Access
-- Anyone can read knowledge_domain data
CREATE POLICY "knowledge_domain_read_public" ON public.knowledge_domain
    FOR SELECT
    USING (true);

-- RLS Policy: Write D - Admins Only
-- Only admins can insert/update/delete knowledge_domain data
CREATE POLICY "knowledge_domain_insert_admin" ON public.knowledge_domain
    FOR INSERT
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "knowledge_domain_update_admin" ON public.knowledge_domain
    FOR UPDATE
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "knowledge_domain_delete_admin" ON public.knowledge_domain
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
CREATE TRIGGER update_knowledge_domain_updated_at
    BEFORE UPDATE ON public.knowledge_domain
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.knowledge_domain TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.knowledge_domain TO authenticated;

-- Insert initial knowledge_domain data
INSERT INTO public.knowledge_domain (label) VALUES
    ('AI'),
    ('edtech'),
    ('healthtech'),
    ('crypto'),
    ('growth'),
    ('craft')
ON CONFLICT (label) DO NOTHING; 