-- Migration: Drop deprecated image column from experience_type table
-- Purpose: Remove the old image column now that we have image_square and image_horizontal
-- The application code has been updated to use image_square for thumbnail fallbacks
-- Created: 2025-01-09 15:13:22

-- Drop the deprecated image column
ALTER TABLE experience_type DROP COLUMN IF EXISTS image;

-- Note: This column has been replaced by:
-- - image_square: for thumbnail/card displays (1:1 aspect ratio)
-- - image_horizontal: for banner/hero displays (2:1 aspect ratio)
-- The application fallback logic now uses image_square instead of image 