-- Migration: Add new columns to users_public table
-- Created: 2025-06-27 15:57:32
-- Description: Adds candidate, employer, first, full_name, gyld, title, list, nomination, profpic, and blurb columns to users_public table

-- Add new columns to users_public table
ALTER TABLE public.users_public 
ADD COLUMN IF NOT EXISTS candidate UUID REFERENCES public.candidates(id),
ADD COLUMN IF NOT EXISTS employer UUID REFERENCES public.employers(id),
ADD COLUMN IF NOT EXISTS first TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS gyld UUID REFERENCES public.gyld(id),
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS list INTEGER,
ADD COLUMN IF NOT EXISTS nomination UUID REFERENCES public.nominations(id),
ADD COLUMN IF NOT EXISTS profpic TEXT,
ADD COLUMN IF NOT EXISTS blurb TEXT;

-- Create indexes for foreign key columns and frequently queried fields
CREATE INDEX IF NOT EXISTS idx_users_public_candidate ON public.users_public(candidate);
CREATE INDEX IF NOT EXISTS idx_users_public_employer ON public.users_public(employer);
CREATE INDEX IF NOT EXISTS idx_users_public_gyld ON public.users_public(gyld);
CREATE INDEX IF NOT EXISTS idx_users_public_nomination ON public.users_public(nomination);

-- Create indexes for other searchable fields
CREATE INDEX IF NOT EXISTS idx_users_public_first ON public.users_public(first);
CREATE INDEX IF NOT EXISTS idx_users_public_full_name ON public.users_public(full_name);
CREATE INDEX IF NOT EXISTS idx_users_public_list ON public.users_public(list);

-- Add comments to document the new columns
COMMENT ON COLUMN public.users_public.candidate IS 'Reference to candidates table - candidate record for this user';
COMMENT ON COLUMN public.users_public.employer IS 'Reference to employers table - employer of this user';
COMMENT ON COLUMN public.users_public.first IS 'User''s first name';
COMMENT ON COLUMN public.users_public.full_name IS 'User''s full name';
COMMENT ON COLUMN public.users_public.gyld IS 'Reference to gyld table - main gyld of this user';
COMMENT ON COLUMN public.users_public.title IS 'User''s professional title';
COMMENT ON COLUMN public.users_public.list IS 'Place on list (ranking/ordering)';
COMMENT ON COLUMN public.users_public.nomination IS 'Reference to nominations table - nomination for this user';
COMMENT ON COLUMN public.users_public.profpic IS 'Link to saved profile image';
COMMENT ON COLUMN public.users_public.blurb IS 'Short statement about user'; 