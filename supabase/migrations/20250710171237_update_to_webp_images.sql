-- Purpose: Update experience_type image URLs to use WebP format for better performance
-- This migration updates all existing JPG image URLs to use the new WebP format

-- Update all image URLs from .jpg to .webp
UPDATE experience_type SET 
    image_square = REPLACE(image_square, '.jpg', '.webp'),
    image_horizontal = REPLACE(image_horizontal, '.jpg', '.webp')
WHERE image_square IS NOT NULL OR image_horizontal IS NOT NULL;

-- Verify the updates (optional - can be removed in production)
-- SELECT label, image_square, image_horizontal FROM experience_type WHERE image_square IS NOT NULL OR image_horizontal IS NOT NULL; 