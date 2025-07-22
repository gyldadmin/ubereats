-- Migration: Add tag column to gathering_ideas table
-- Purpose: Add tagline field to gathering ideas for additional descriptive text
-- Created: 2025-01-20 09:44:28

-- Add the tag column to gathering_ideas table
-- This column allows storing a tagline/short descriptive phrase for each gathering idea
ALTER TABLE public.gathering_ideas 
ADD COLUMN IF NOT EXISTS tag TEXT;

-- Add helpful comment explaining the column's purpose
COMMENT ON COLUMN public.gathering_ideas.tag IS 'Tagline or short descriptive phrase for the gathering idea';

-- Add index for tag column to optimize searches and filtering
-- This helps with performance when searching or filtering gathering ideas by tagline
CREATE INDEX IF NOT EXISTS idx_gathering_ideas_tag 
ON public.gathering_ideas(tag);

-- Add a partial index for non-null tag values to optimize searches
-- This index only includes rows where tag has actual data
CREATE INDEX IF NOT EXISTS idx_gathering_ideas_tag_non_null 
ON public.gathering_ideas(tag) 
WHERE tag IS NOT NULL AND tag != '';

-- Verification queries (commented out for production)
-- These can be uncommented during testing to verify the migration worked correctly

-- Check that the column was added successfully:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'gathering_ideas' AND column_name = 'tag';

-- Check that existing data remains intact:
-- SELECT COUNT(*) as total_records FROM public.gathering_ideas;

-- Check that the indexes were created:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'gathering_ideas' 
-- AND indexname LIKE '%tag%';

-- Update table comment to reflect the new column
COMMENT ON TABLE public.gathering_ideas IS 'Table for storing gathering ideas with detailed descriptions and categorization, includes tagline field for additional descriptive text, public read access and admin-only write access'; 