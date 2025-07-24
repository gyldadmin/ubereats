-- Migration: Add template_variables and json_template columns to email_template_ids table
-- Date: 2025-01-23 09:02:04
-- Description: Adds template_variables (TEXT[]) and json_template (JSONB) columns to email_template_ids table
-- for storing email template variables and JSON structures with placeholder substitution

-- Add template_variables column to store list of all variables used in each template
-- This enables validation of required inputs before sending emails
DO $$
BEGIN
    -- Check if template_variables column doesn't exist before adding it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_template_ids' 
        AND column_name = 'template_variables'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE email_template_ids 
        ADD COLUMN template_variables TEXT[];
        
        -- Add comment explaining the purpose
        COMMENT ON COLUMN email_template_ids.template_variables IS 'Array of variable names used in the JSON template (e.g., [''body1'', ''subject'', ''buttonurl'']). Used for validation before email sending.';
        
        RAISE NOTICE 'Added template_variables column to email_template_ids table';
    ELSE
        RAISE NOTICE 'Column template_variables already exists in email_template_ids table, skipping';
    END IF;
END $$;

-- Add json_template column to store the SendGrid API JSON structure with {{variable}} placeholders
DO $$
BEGIN
    -- Check if json_template column doesn't exist before adding it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_template_ids' 
        AND column_name = 'json_template'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE email_template_ids 
        ADD COLUMN json_template JSONB;
        
        -- Add comment explaining the purpose
        COMMENT ON COLUMN email_template_ids.json_template IS 'JSONB structure for SendGrid API calls with {{variable}} placeholders that get substituted with actual values before sending. Example: {"from": {"email": "{{sender_email}}"}}';
        
        RAISE NOTICE 'Added json_template column to email_template_ids table';
    ELSE
        RAISE NOTICE 'Column json_template already exists in email_template_ids table, skipping';
    END IF;
END $$;

-- Create GIN index on json_template for efficient JSONB queries
-- This is useful if we need to search for specific keys or values within the templates
DO $$
BEGIN
    -- Check if index doesn't exist before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'email_template_ids' 
        AND indexname = 'idx_email_template_ids_json_template_gin'
    ) THEN
        CREATE INDEX idx_email_template_ids_json_template_gin 
        ON email_template_ids USING GIN (json_template);
        
        COMMENT ON INDEX idx_email_template_ids_json_template_gin IS 'GIN index on json_template for efficient JSONB operations and searches';
        
        RAISE NOTICE 'Created GIN index on json_template column';
    ELSE
        RAISE NOTICE 'GIN index on json_template already exists, skipping';
    END IF;
END $$;

-- Create GIN index on template_variables array for efficient array operations
-- This enables fast searches for templates that use specific variables
DO $$
BEGIN
    -- Check if index doesn't exist before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'email_template_ids' 
        AND indexname = 'idx_email_template_ids_template_variables_gin'
    ) THEN
        CREATE INDEX idx_email_template_ids_template_variables_gin 
        ON email_template_ids USING GIN (template_variables);
        
        COMMENT ON INDEX idx_email_template_ids_template_variables_gin IS 'GIN index on template_variables array for efficient array searches (e.g., templates containing specific variables)';
        
        RAISE NOTICE 'Created GIN index on template_variables column';
    ELSE
        RAISE NOTICE 'GIN index on template_variables already exists, skipping';
    END IF;
END $$;

-- Verify the migration by checking the new columns exist
DO $$
DECLARE
    template_vars_exists BOOLEAN;
    json_template_exists BOOLEAN;
BEGIN
    -- Check if both columns now exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_template_ids' 
        AND column_name = 'template_variables'
        AND table_schema = 'public'
    ) INTO template_vars_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_template_ids' 
        AND column_name = 'json_template'
        AND table_schema = 'public'
    ) INTO json_template_exists;
    
    IF template_vars_exists AND json_template_exists THEN
        RAISE NOTICE '✅ Migration successful: Both template_variables and json_template columns added to email_template_ids table';
    ELSE
        RAISE WARNING '⚠️  Migration verification failed: One or both columns may not have been created properly';
    END IF;
END $$;

-- Example usage comment for future reference
/*
Example data insertion after this migration:

INSERT INTO email_template_ids (label, template_variables, json_template) 
VALUES (
    'basic_with_button',
    ARRAY['body1', 'subject', 'buttonurl', 'buttontext', 'unsubscribeurl', 'to_address', 'sender_email', 'sender_fullname', 'reply_to_address', 'template_id'],
    '{
        "personalizations": [{
            "to": [{"email": "{{to_address}}"}],
            "dynamic_template_data": {
                "body1": "{{body1}}",
                "subject": "{{subject}}",
                "buttonurl": "{{buttonurl}}",
                "buttontext": "{{buttontext}}",
                "unsubscribeurl": "{{unsubscribeurl}}"
            }
        }],
        "from": {
            "email": "{{sender_email}}",
            "name": "{{sender_fullname}}"
        },
        "reply_to": {
            "email": "{{reply_to_address}}"
        },
        "template_id": "{{template_id}}"
    }'::jsonb
);
*/ 