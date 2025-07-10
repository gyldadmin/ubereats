-- Migration: Add image columns to experience_type table
-- Description: Add support for square (1:1) and horizontal (2:1) image references
-- Date: 2025-01-09 14:19:45

-- Add image_square column (1:1 aspect ratio image reference)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'experience_type' 
        AND column_name = 'image_square'
    ) THEN
        ALTER TABLE public.experience_type 
        ADD COLUMN image_square TEXT;
        
        -- Add comment to explain the column purpose
        COMMENT ON COLUMN public.experience_type.image_square IS 'URL or path to square (1:1 aspect ratio) image for this experience type';
    END IF;
END $$;

-- Add image_horizontal column (2:1 aspect ratio image reference)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'experience_type' 
        AND column_name = 'image_horizontal'
    ) THEN
        ALTER TABLE public.experience_type 
        ADD COLUMN image_horizontal TEXT;
        
        -- Add comment to explain the column purpose
        COMMENT ON COLUMN public.experience_type.image_horizontal IS 'URL or path to horizontal (2:1 aspect ratio) image for this experience type';
    END IF;
END $$;

-- Create indexes for better query performance if these columns will be frequently queried
-- Note: Only create indexes if you expect to query by these columns frequently
-- For simple lookups by ID, these indexes may not be necessary

-- Optional: Add index for image_square if you'll query by it
-- CREATE INDEX IF NOT EXISTS idx_experience_type_image_square 
-- ON public.experience_type(image_square) 
-- WHERE image_square IS NOT NULL;

-- Optional: Add index for image_horizontal if you'll query by it
-- CREATE INDEX IF NOT EXISTS idx_experience_type_image_horizontal 
-- ON public.experience_type(image_horizontal) 
-- WHERE image_horizontal IS NOT NULL;

-- Verify the migration was successful
-- This will show the table structure after the migration
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'experience_type'
ORDER BY ordinal_position; 