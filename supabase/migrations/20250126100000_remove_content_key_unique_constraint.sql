-- Migration: Remove unique constraint on content_templates.content_key
-- Date: 2025-01-26 10:00:00
-- Description: Removes the unique constraint on content_key to allow multiple templates with same key but different content_type

-- Drop the unique constraint on content_key
-- First, check if the constraint exists and drop it
DO $$
BEGIN
    -- Drop unique constraint on content_key column
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'content_templates_content_key_key' 
        AND table_name = 'content_templates'
    ) THEN
        ALTER TABLE content_templates DROP CONSTRAINT content_templates_content_key_key;
        RAISE NOTICE 'Dropped unique constraint on content_templates.content_key';
    END IF;
    
    -- Also check for any unique index on content_key
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'content_templates_content_key_key' 
        AND tablename = 'content_templates'
    ) THEN
        DROP INDEX content_templates_content_key_key;
        RAISE NOTICE 'Dropped unique index on content_templates.content_key';
    END IF;
END $$;

-- Add a comment explaining the change
COMMENT ON COLUMN content_templates.content_key IS 'Identifier for the content template (no longer unique - allows multiple templates with same key but different content_type)';

-- Optionally, create a composite unique constraint on content_key + content_type
-- This ensures uniqueness per content type while allowing same key across different types
ALTER TABLE content_templates 
ADD CONSTRAINT content_templates_content_key_content_type_unique 
UNIQUE (content_key, content_type);

COMMENT ON CONSTRAINT content_templates_content_key_content_type_unique ON content_templates 
IS 'Ensures uniqueness of content_key within each content_type (push, email, etc.)'; 