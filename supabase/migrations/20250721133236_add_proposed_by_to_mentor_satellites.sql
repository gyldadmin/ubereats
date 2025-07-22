-- Migration: Add proposed_by column to mentor_satellites table
-- Date: 2025-07-21
-- Purpose: Track which user proposed a mentor (for mentor proposals workflow)

-- Add the proposed_by column to track who proposed the mentor
ALTER TABLE public.mentor_satellites 
ADD COLUMN IF NOT EXISTS proposed_by UUID 
REFERENCES auth.users(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Add comment to document the new column
COMMENT ON COLUMN public.mentor_satellites.proposed_by IS 'References auth.users(id) - tracks which user proposed this mentor. NULL for mentors not created through proposal workflow.';

-- Create index on proposed_by for efficient querying
CREATE INDEX IF NOT EXISTS idx_mentor_satellites_proposed_by 
ON public.mentor_satellites(proposed_by);

-- Create partial index to efficiently find mentor proposals (non-null proposed_by)
CREATE INDEX IF NOT EXISTS idx_mentor_satellites_proposals 
ON public.mentor_satellites(proposed_by) 
WHERE proposed_by IS NOT NULL; 