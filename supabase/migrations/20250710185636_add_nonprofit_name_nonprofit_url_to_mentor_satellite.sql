-- Add nonprofit information columns to mentor_satellites table
-- This migration adds fields for tracking nonprofit organizations associated with mentors

-- Add nonprofit_name column
ALTER TABLE public.mentor_satellites 
ADD COLUMN IF NOT EXISTS nonprofit_name TEXT;

-- Add nonprofit_url column  
ALTER TABLE public.mentor_satellites 
ADD COLUMN IF NOT EXISTS nonprofit_url TEXT;

-- Add comments explaining the new columns
COMMENT ON COLUMN public.mentor_satellites.nonprofit_name IS 'Name of nonprofit organization associated with this mentor';
COMMENT ON COLUMN public.mentor_satellites.nonprofit_url IS 'URL/website of nonprofit organization associated with this mentor';

-- Create indexes for the new columns to improve query performance
-- These fields may be frequently queried for filtering or searching mentors by nonprofit affiliation
CREATE INDEX IF NOT EXISTS idx_mentor_satellites_nonprofit_name 
ON public.mentor_satellites(nonprofit_name);

CREATE INDEX IF NOT EXISTS idx_mentor_satellites_nonprofit_url 
ON public.mentor_satellites(nonprofit_url);

-- Composite index for queries that might search by both nonprofit name and URL together
CREATE INDEX IF NOT EXISTS idx_mentor_satellites_nonprofit_name_url 
ON public.mentor_satellites(nonprofit_name, nonprofit_url); 