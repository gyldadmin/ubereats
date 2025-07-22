-- Migration: Add gathering_idea column to gathering_other table
-- Purpose: Add foreign key reference to gathering_ideas table for associating gatherings with specific ideas
-- Created: 2025-01-20 12:15:15

-- Add the gathering_idea column to gathering_other table
-- This column creates a relationship between gatherings and gathering ideas
ALTER TABLE public.gathering_other 
ADD COLUMN IF NOT EXISTS gathering_idea UUID REFERENCES public.gathering_ideas(id);

-- Add helpful comment explaining the column's purpose
COMMENT ON COLUMN public.gathering_other.gathering_idea IS 'Reference to gathering_ideas table - associates this gathering with a specific gathering idea template';

-- Add index for gathering_idea column to optimize joins and lookups
-- This helps with performance when querying gatherings by their associated ideas
CREATE INDEX IF NOT EXISTS idx_gathering_other_gathering_idea 
ON public.gathering_other(gathering_idea);

-- Add index to optimize reverse lookups (finding gatherings for a specific idea)
-- This is useful for analytics and reporting on idea usage
CREATE INDEX IF NOT EXISTS idx_gathering_other_gathering_idea_non_null 
ON public.gathering_other(gathering_idea) 
WHERE gathering_idea IS NOT NULL;

-- Verification queries (commented out for production)
-- These can be uncommented during testing to verify the migration worked correctly

-- Check that the column was added successfully:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'gathering_other' AND column_name = 'gathering_idea';

-- Check that the foreign key constraint was created:
-- SELECT conname, contype, confrelid::regclass AS referenced_table 
-- FROM pg_constraint 
-- WHERE conrelid = 'gathering_other'::regclass 
-- AND contype = 'f' 
-- AND conname LIKE '%gathering_idea%';

-- Check that existing data remains intact:
-- SELECT COUNT(*) as total_records FROM public.gathering_other;

-- Check that the indexes were created:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'gathering_other' 
-- AND indexname LIKE '%gathering_idea%';

-- Test the foreign key relationship (requires data in both tables):
-- SELECT go.id, go.gathering_idea, gi.label as idea_label
-- FROM public.gathering_other go
-- LEFT JOIN public.gathering_ideas gi ON go.gathering_idea = gi.id
-- LIMIT 5;

-- Update table comment to reflect the new relationship
COMMENT ON TABLE public.gathering_other IS 'Satellite table for gatherings with 1:1 relationship containing additional gathering metadata, configuration, and association with gathering ideas'; 