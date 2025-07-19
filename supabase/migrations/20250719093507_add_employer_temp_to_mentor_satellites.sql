-- Migration: Add employer_temp column to mentor_satellites table
-- Purpose: Add temporary employer field for employer inputs not linked to employers table
-- Created: 2025-01-19 09:35:07

-- Add the employer_temp column to mentor_satellites table
-- This column allows mentors to enter employer information that isn't yet in the employers table
ALTER TABLE public.mentor_satellites 
ADD COLUMN IF NOT EXISTS employer_temp TEXT;

-- Add helpful comment explaining the column's purpose
COMMENT ON COLUMN public.mentor_satellites.employer_temp IS 'Temporary employer text field for employer names not yet linked to the employers table. Used when mentor enters employer information that needs to be processed/verified before creating an employers record.';

-- Add index for employer_temp if it will be frequently queried for filtering or searching
-- This helps with performance when searching mentors by employer name
CREATE INDEX IF NOT EXISTS idx_mentor_satellites_employer_temp 
ON public.mentor_satellites(employer_temp);

-- Add a partial index for non-null employer_temp values to optimize searches
-- This index only includes rows where employer_temp has actual data
CREATE INDEX IF NOT EXISTS idx_mentor_satellites_employer_temp_non_null 
ON public.mentor_satellites(employer_temp) 
WHERE employer_temp IS NOT NULL AND employer_temp != '';

-- Verification queries (commented out for production)
-- These can be uncommented during testing to verify the migration worked correctly

-- Check that the column was added successfully:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'mentor_satellites' AND column_name = 'employer_temp';

-- Check that existing data remains intact:
-- SELECT COUNT(*) as total_records FROM public.mentor_satellites;

-- Check that the indexes were created:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'mentor_satellites' 
-- AND indexname LIKE '%employer_temp%';

-- Add a helpful comment to document this change in the table
COMMENT ON TABLE public.mentor_satellites IS 'Mentor profile and display information. Updated to include employer_temp field for temporary employer data entry.'; 