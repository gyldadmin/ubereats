-- Modify gatherings table: add new reference columns, remove deprecated fields, improve indexing
-- This migration modernizes the gatherings table structure with proper relationships and removes unused fields

-- Add gathering_status column for status tracking
ALTER TABLE public.gatherings 
ADD COLUMN IF NOT EXISTS gathering_status UUID REFERENCES public.gathering_status(id);

COMMENT ON COLUMN public.gatherings.gathering_status IS 'Status of gathering (unsaved, pre-launch, launched, cancelled, finished)';

-- Add experience_type column for gathering categorization
ALTER TABLE public.gatherings 
ADD COLUMN IF NOT EXISTS experience_type UUID REFERENCES public.experience_type(id);

COMMENT ON COLUMN public.gatherings.experience_type IS 'Type of gathering (Mentoring, Course, Happy Hour, etc.)';

-- Add gyld array column for associated gylds
ALTER TABLE public.gatherings 
ADD COLUMN IF NOT EXISTS gyld UUID[];

COMMENT ON COLUMN public.gatherings.gyld IS 'Array of gyld IDs associated with this gathering';

-- Add host array column for gathering hosts (auth.users reference)
ALTER TABLE public.gatherings 
ADD COLUMN IF NOT EXISTS host UUID[];

COMMENT ON COLUMN public.gatherings.host IS 'Array of user IDs who are hosting this gathering';

-- Add experience array column for associated experiences
ALTER TABLE public.gatherings 
ADD COLUMN IF NOT EXISTS experience UUID[];

COMMENT ON COLUMN public.gatherings.experience IS 'Array of experience IDs associated with this gathering';

-- Remove deprecated columns that are no longer needed
ALTER TABLE public.gatherings 
DROP COLUMN IF EXISTS address;

ALTER TABLE public.gatherings 
DROP COLUMN IF EXISTS image;

-- Create indexes for new foreign key and array fields

-- Index for gathering_status foreign key (for filtering by status)
CREATE INDEX IF NOT EXISTS idx_gatherings_gathering_status 
ON public.gatherings(gathering_status);

-- Index for experience_type foreign key (for filtering by type)
CREATE INDEX IF NOT EXISTS idx_gatherings_experience_type 
ON public.gatherings(experience_type);

-- GIN indexes for array fields (better performance for array operations)
CREATE INDEX IF NOT EXISTS idx_gatherings_gyld_gin 
ON public.gatherings USING GIN(gyld);

CREATE INDEX IF NOT EXISTS idx_gatherings_host_gin 
ON public.gatherings USING GIN(host);

CREATE INDEX IF NOT EXISTS idx_gatherings_experience_gin 
ON public.gatherings USING GIN(experience);

-- Add index for existing start_time column (for time-based queries and sorting)
CREATE INDEX IF NOT EXISTS idx_gatherings_start_time 
ON public.gatherings(start_time);

-- Composite indexes for common query patterns

-- Index for status + start_time (find gatherings by status within time range)
CREATE INDEX IF NOT EXISTS idx_gatherings_status_start_time 
ON public.gatherings(gathering_status, start_time);

-- Index for experience_type + start_time (find gatherings by type within time range)
CREATE INDEX IF NOT EXISTS idx_gatherings_type_start_time 
ON public.gatherings(experience_type, start_time); 