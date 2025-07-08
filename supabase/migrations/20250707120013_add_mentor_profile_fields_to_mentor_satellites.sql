-- Add mentor profile and fellow-specific columns to mentor_satellites table
-- This migration expands mentor_satellites with detailed profile information and fellow nomination tracking

-- Add first name column
ALTER TABLE public.mentor_satellites 
ADD COLUMN IF NOT EXISTS first TEXT;

COMMENT ON COLUMN public.mentor_satellites.first IS 'First name of this mentor';

-- Add full name column (required field)
ALTER TABLE public.mentor_satellites 
ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.mentor_satellites.full_name IS 'Full name of this mentor';

-- Add profile picture link
ALTER TABLE public.mentor_satellites 
ADD COLUMN IF NOT EXISTS profpic TEXT;

COMMENT ON COLUMN public.mentor_satellites.profpic IS 'Link to image of this mentor';

-- Add job title
ALTER TABLE public.mentor_satellites 
ADD COLUMN IF NOT EXISTS title TEXT;

COMMENT ON COLUMN public.mentor_satellites.title IS 'Job title of this mentor';

-- Add bio field
ALTER TABLE public.mentor_satellites 
ADD COLUMN IF NOT EXISTS bio TEXT;

COMMENT ON COLUMN public.mentor_satellites.bio IS 'Bio for this mentor';

-- Add tagline field
ALTER TABLE public.mentor_satellites 
ADD COLUMN IF NOT EXISTS tagline TEXT;

COMMENT ON COLUMN public.mentor_satellites.tagline IS 'Short blurb about this mentor';

-- Add fellow acceptance date
ALTER TABLE public.mentor_satellites 
ADD COLUMN IF NOT EXISTS fellow_accept_date TIMESTAMPTZ;

COMMENT ON COLUMN public.mentor_satellites.fellow_accept_date IS 'Date that mentor accepts fellow nomination';

-- Add fellow social preview image
ALTER TABLE public.mentor_satellites 
ADD COLUMN IF NOT EXISTS fellow_social_preview TEXT;

COMMENT ON COLUMN public.mentor_satellites.fellow_social_preview IS 'Link to image about new fellow to share on social media';

-- Add fellow webpage code (unique identifier for fellow pages)
ALTER TABLE public.mentor_satellites 
ADD COLUMN IF NOT EXISTS fellow_webpage_code TEXT UNIQUE;

COMMENT ON COLUMN public.mentor_satellites.fellow_webpage_code IS 'Unique code for fellow''s webpage';

-- Create indexes for frequently queried fields

-- Index for full name (for searching by name)
CREATE INDEX IF NOT EXISTS idx_mentor_satellites_full_name ON public.mentor_satellites(full_name);

-- Index for first name (for searching/filtering)
CREATE INDEX IF NOT EXISTS idx_mentor_satellites_first ON public.mentor_satellites(first);

-- Index for fellow_webpage_code (already unique, but helpful for queries)
CREATE INDEX IF NOT EXISTS idx_mentor_satellites_fellow_webpage_code ON public.mentor_satellites(fellow_webpage_code);

-- Index for fellow_accept_date (for sorting by acceptance date)
CREATE INDEX IF NOT EXISTS idx_mentor_satellites_fellow_accept_date ON public.mentor_satellites(fellow_accept_date);

-- Composite index for common queries (full name + title)
CREATE INDEX IF NOT EXISTS idx_mentor_satellites_full_name_title ON public.mentor_satellites(full_name, title); 