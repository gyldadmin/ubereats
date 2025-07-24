-- Migration: Add template_id column to email_template_ids table
-- Date: 2025-01-23 11:56:33
-- Description: Adds template_id (TEXT) column to email_template_ids table to store 
-- SendGrid template IDs for mapping email template labels to actual SendGrid template identifiers

BEGIN;

-- Add template_id column to email_template_ids table
DO $$ 
BEGIN
    -- Check if template_id column doesn't exist before adding it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_template_ids' 
        AND column_name = 'template_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE email_template_ids 
        ADD COLUMN template_id TEXT;
        
        -- Add comment explaining the purpose of the template_id column
        COMMENT ON COLUMN email_template_ids.template_id IS 'SendGrid template ID (e.g., d-1234567890abcdef) used to map email template labels to actual SendGrid dynamic templates';
        
        RAISE NOTICE 'Added template_id column to email_template_ids table';
    ELSE
        RAISE NOTICE 'Column template_id already exists in email_template_ids table, skipping';
    END IF;
END $$;

-- Create index on template_id column for efficient SendGrid template lookups
-- Template IDs are frequently queried when sending emails through the email service
DO $$ 
BEGIN
    -- Check if index doesn't exist before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'email_template_ids' 
        AND indexname = 'idx_email_template_ids_template_id'
    ) THEN
        CREATE INDEX idx_email_template_ids_template_id ON email_template_ids(template_id);
        
        COMMENT ON INDEX idx_email_template_ids_template_id IS 'Index on SendGrid template_id for efficient email template lookups during email sending operations';
        
        RAISE NOTICE 'Created index on email_template_ids.template_id column';
    ELSE
        RAISE NOTICE 'Index on email_template_ids.template_id already exists, skipping';
    END IF;
END $$;

-- Optional: Create unique index if SendGrid template IDs should be unique across all email templates
-- Uncomment the following block if each SendGrid template should only be used by one email template label
/*
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'email_template_ids' 
        AND indexname = 'idx_email_template_ids_template_id_unique'
    ) THEN
        CREATE UNIQUE INDEX idx_email_template_ids_template_id_unique ON email_template_ids(template_id) 
        WHERE template_id IS NOT NULL;
        
        COMMENT ON INDEX idx_email_template_ids_template_id_unique IS 'Unique constraint on SendGrid template_id to prevent multiple email templates from using the same SendGrid template';
        
        RAISE NOTICE 'Created unique index on email_template_ids.template_id column';
    ELSE
        RAISE NOTICE 'Unique index on email_template_ids.template_id already exists, skipping';
    END IF;
END $$;
*/

-- Update table comment to reflect the new column
COMMENT ON TABLE email_template_ids IS 'Email template configuration mapping table storing labels, SendGrid template IDs, template variables, and JSON structures for email service operations';

-- Verify the migration by checking the new column exists
DO $$
DECLARE
    template_id_column_exists BOOLEAN;
BEGIN
    -- Check if template_id column now exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_template_ids' 
        AND column_name = 'template_id'
        AND table_schema = 'public'
    ) INTO template_id_column_exists;
    
    IF template_id_column_exists THEN
        RAISE NOTICE '✅ Migration successful: template_id column added to email_template_ids table';
    ELSE
        RAISE WARNING '⚠️  Migration verification failed: template_id column may not have been created properly';
    END IF;
END $$;

-- Example usage comment for future reference
/*
Example data update after this migration:

UPDATE email_template_ids 
SET template_id = 'd-1234567890abcdef' 
WHERE label = 'basic_with_button';

This maps the 'basic_with_button' email template label to the actual SendGrid dynamic template ID.
*/

COMMIT; 