-- Migration: Add social and priority columns to experience_type table
-- Created: 2025-07-16 15:23:01
-- Purpose: Add boolean flags to categorize experience types as social events and prioritized events

-- Add social column to experience_type table
-- This column indicates whether an experience type is considered a social event
ALTER TABLE experience_type 
ADD COLUMN IF NOT EXISTS social BOOLEAN DEFAULT FALSE;

-- Add priority column to experience_type table  
-- This column indicates whether an experience type should be prioritized in displays
ALTER TABLE experience_type 
ADD COLUMN IF NOT EXISTS priority BOOLEAN DEFAULT FALSE;

-- Update social = TRUE for social experience types
-- These are events that are primarily social in nature
UPDATE experience_type 
SET social = TRUE 
WHERE label IN (
    'Other', 
    'Coworking', 
    'Happy Hour', 
    'Pro Bono', 
    'Podcast Club', 
    'Supper Club', 
    'Lunch', 
    'Team', 
    'Outing'
);

-- Update priority = TRUE for prioritized experience types
-- These are events that should be given priority in UI displays
UPDATE experience_type 
SET priority = TRUE 
WHERE label IN (
    'Other', 
    'Happy Hour', 
    'Supper Club', 
    'Outing'
);

-- Add indexes for performance if these columns will be frequently queried
-- Index on social column for filtering social events
CREATE INDEX IF NOT EXISTS idx_experience_type_social 
ON experience_type (social) 
WHERE social = TRUE;

-- Index on priority column for filtering prioritized events
CREATE INDEX IF NOT EXISTS idx_experience_type_priority 
ON experience_type (priority) 
WHERE priority = TRUE;

-- Composite index for queries that filter by both social and priority
CREATE INDEX IF NOT EXISTS idx_experience_type_social_priority 
ON experience_type (social, priority) 
WHERE social = TRUE OR priority = TRUE;

-- Add comments to document the new columns
COMMENT ON COLUMN experience_type.social IS 'Boolean flag indicating whether this experience type is a social event';
COMMENT ON COLUMN experience_type.priority IS 'Boolean flag indicating whether this experience type should be prioritized in displays';

-- Verify the changes by showing the updated records
-- This will help confirm the migration was successful
SELECT 
    label,
    social,
    priority,
    created_at
FROM experience_type 
ORDER BY 
    priority DESC, 
    social DESC, 
    label ASC; 