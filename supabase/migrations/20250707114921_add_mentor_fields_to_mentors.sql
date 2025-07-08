-- Add new columns to mentors table to expand mentor profile information
-- This migration adds email, profile links, references to related entities, and ordering fields

-- Add email column for mentor contact information
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN public.mentors.email IS 'Email address for this mentor';

-- Add proflink column with unique constraint for LinkedIn profiles
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS proflink TEXT UNIQUE;

COMMENT ON COLUMN public.mentors.proflink IS 'LinkedIn profile address for this member, without https:// or www.';

-- Add employer reference
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS employer UUID REFERENCES public.employers(id);

COMMENT ON COLUMN public.mentors.employer IS 'Employer of this mentor';

-- Add mentor_status reference
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS mentor_status UUID REFERENCES public.mentor_status(id);

COMMENT ON COLUMN public.mentors.mentor_status IS 'Status of this mentor (e.g., Active, Retired, etc.)';

-- Add mentor_approval reference
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS mentor_approval UUID REFERENCES public.mentor_approval(id);

COMMENT ON COLUMN public.mentors.mentor_approval IS 'Approval status of this mentor (e.g., Approved, Pending, etc.)';

-- Add gyld_type array reference
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS gyld_type UUID[];

COMMENT ON COLUMN public.mentors.gyld_type IS 'Array of gyld_type IDs for this mentor';

-- Add metro array reference
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS metro UUID[];

COMMENT ON COLUMN public.mentors.metro IS 'Array of metro IDs for this mentor';

-- Add order column for display ordering
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS "order" INTEGER;

COMMENT ON COLUMN public.mentors."order" IS 'Order to show this mentor in lists/displays';

-- Add gyld array reference
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS gyld UUID[];

COMMENT ON COLUMN public.mentors.gyld IS 'Array of gyld IDs for this mentor';

-- Add person reference
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS person UUID REFERENCES public.person(id);

COMMENT ON COLUMN public.mentors.person IS 'Person record for this mentor';

-- Create indexes for foreign key fields and frequently queried columns

-- Index for proflink (already unique, but helpful for queries)
CREATE INDEX IF NOT EXISTS idx_mentors_proflink ON public.mentors(proflink);

-- Index for employer foreign key
CREATE INDEX IF NOT EXISTS idx_mentors_employer ON public.mentors(employer);

-- Index for mentor_status foreign key
CREATE INDEX IF NOT EXISTS idx_mentors_mentor_status ON public.mentors(mentor_status);

-- Index for mentor_approval foreign key
CREATE INDEX IF NOT EXISTS idx_mentors_mentor_approval ON public.mentors(mentor_approval);

-- GIN indexes for array fields (better performance for array operations)
CREATE INDEX IF NOT EXISTS idx_mentors_gyld_type_gin ON public.mentors USING GIN(gyld_type);

CREATE INDEX IF NOT EXISTS idx_mentors_metro_gin ON public.mentors USING GIN(metro);

CREATE INDEX IF NOT EXISTS idx_mentors_gyld_gin ON public.mentors USING GIN(gyld);

-- Index for order column (for sorting)
CREATE INDEX IF NOT EXISTS idx_mentors_order ON public.mentors("order");

-- Index for person foreign key
CREATE INDEX IF NOT EXISTS idx_mentors_person ON public.mentors(person); 