-- Add display and functional columns to gathering_displays table
-- This migration expands gathering display capabilities with address, media, participants, and metadata

-- Add address column for gathering location
ALTER TABLE public.gathering_displays 
ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN public.gathering_displays.address IS 'Gathering address or location details';

-- Add image column for gathering visual representation
ALTER TABLE public.gathering_displays 
ADD COLUMN IF NOT EXISTS image TEXT;

COMMENT ON COLUMN public.gathering_displays.image IS 'Link to gathering image or visual representation';

-- Add description column for gathering details
ALTER TABLE public.gathering_displays 
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.gathering_displays.description IS 'Detailed description of the gathering content and purpose';

-- Add scribe column for gathering documentation
ALTER TABLE public.gathering_displays 
ADD COLUMN IF NOT EXISTS scribe UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.gathering_displays.scribe IS 'User responsible for documenting/scribing this gathering';

-- Add meeting_link column for remote access
ALTER TABLE public.gathering_displays 
ADD COLUMN IF NOT EXISTS meeting_link TEXT;

COMMENT ON COLUMN public.gathering_displays.meeting_link IS 'Link for remote meeting access (Zoom, Teams, etc.)';

-- Add location_instructions column for access guidance
ALTER TABLE public.gathering_displays 
ADD COLUMN IF NOT EXISTS location_instructions TEXT;

COMMENT ON COLUMN public.gathering_displays.location_instructions IS 'Instructions for how to access the gathering location';

-- Add mentor array column for associated mentors
ALTER TABLE public.gathering_displays 
ADD COLUMN IF NOT EXISTS mentor UUID[];

COMMENT ON COLUMN public.gathering_displays.mentor IS 'Array of mentor IDs associated with this gathering';

-- Add learning_topic column for topic classification
ALTER TABLE public.gathering_displays 
ADD COLUMN IF NOT EXISTS learning_topic UUID REFERENCES public.learning_topic(id);

COMMENT ON COLUMN public.gathering_displays.learning_topic IS 'Learning topic/subject for this gathering';

-- Create indexes for foreign key fields and frequently queried columns

-- Index for scribe foreign key (for finding gatherings by scribe)
CREATE INDEX IF NOT EXISTS idx_gathering_displays_scribe 
ON public.gathering_displays(scribe);

-- GIN index for mentor array field (for efficient array operations)
CREATE INDEX IF NOT EXISTS idx_gathering_displays_mentor_gin 
ON public.gathering_displays USING GIN(mentor);

-- Index for learning_topic foreign key (for finding gatherings by topic)
CREATE INDEX IF NOT EXISTS idx_gathering_displays_learning_topic 
ON public.gathering_displays(learning_topic);

-- Additional composite indexes for common query patterns

-- Index for learning_topic + scribe (topic gatherings by scribe)
CREATE INDEX IF NOT EXISTS idx_gathering_displays_topic_scribe 
ON public.gathering_displays(learning_topic, scribe); 