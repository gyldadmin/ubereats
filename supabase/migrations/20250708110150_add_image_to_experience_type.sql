-- Migration: Add image column to experience_type table
-- Purpose: Store standard fallback images for each gathering/experience type
-- Created: 2025-01-08 11:01:50

-- Add image column to experience_type table
-- This will store file paths or URLs to default images for each experience type
ALTER TABLE experience_type 
ADD COLUMN IF NOT EXISTS image TEXT;

-- Add comment to document the new column
COMMENT ON COLUMN experience_type.image IS 'Standard fallback image path/URL for this experience type, used when gathering-specific images are not available';

-- Verify the column was added successfully
-- (This is for documentation purposes - actual verification happens during deployment)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'experience_type' AND column_name = 'image';

-- Note: No index needed for this column as it will primarily be used for individual lookups
-- rather than filtering/searching operations 