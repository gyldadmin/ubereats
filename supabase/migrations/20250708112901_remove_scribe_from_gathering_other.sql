-- Migration: Remove scribe column from gathering_other table
-- Purpose: Remove duplicate scribe column - scribe should only be in gathering_displays table
-- Created: 2025-01-08 11:29:01

-- Remove the scribe column from gathering_other table
-- Note: This assumes the scribe data is properly stored in gathering_displays table
ALTER TABLE gathering_other 
DROP COLUMN IF EXISTS scribe;

-- Add comment to document the change
COMMENT ON TABLE gathering_other IS 'Satellite table for gatherings with 1:1 relationship containing additional gathering metadata and configuration. Note: scribe information is stored in gathering_displays table.'; 