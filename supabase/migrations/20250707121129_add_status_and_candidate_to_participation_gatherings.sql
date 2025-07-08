-- Add RSVP status and candidate reference columns to participation_gatherings table
-- This migration expands participation tracking with status and candidate information

-- Add part_gath_status column for RSVP status tracking
ALTER TABLE public.participation_gatherings 
ADD COLUMN IF NOT EXISTS part_gath_status UUID REFERENCES public.part_gath_status(id);

COMMENT ON COLUMN public.participation_gatherings.part_gath_status IS 'RSVP status for event (yes, no, waitlist)';

-- Add candidate column for gyld candidate tracking
ALTER TABLE public.participation_gatherings 
ADD COLUMN IF NOT EXISTS candidate UUID REFERENCES public.candidates(id);

COMMENT ON COLUMN public.participation_gatherings.candidate IS 'Gyld candidate who has RSVPed for event';

-- Create indexes for foreign key fields to improve query performance

-- Index for part_gath_status foreign key (for filtering by RSVP status)
CREATE INDEX IF NOT EXISTS idx_participation_gatherings_part_gath_status 
ON public.participation_gatherings(part_gath_status);

-- Index for candidate foreign key (for finding participations by candidate)
CREATE INDEX IF NOT EXISTS idx_participation_gatherings_candidate 
ON public.participation_gatherings(candidate);

-- Composite index for common queries (gathering + status)
CREATE INDEX IF NOT EXISTS idx_participation_gatherings_gathering_status 
ON public.participation_gatherings(gathering_id, part_gath_status);

-- Composite index for user + status queries
CREATE INDEX IF NOT EXISTS idx_participation_gatherings_user_status 
ON public.participation_gatherings(user_id, part_gath_status); 