-- Migration: Add address column to email table
-- Date: 2025-01-23 11:55:53
-- Description: Adds address (TEXT) column to email table to store email addresses
-- for email service configuration and management

BEGIN;

-- Add address column to email table
DO $$ 
BEGIN
    -- Check if address column doesn't exist before adding it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email' 
        AND column_name = 'address'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE email 
        ADD COLUMN address TEXT;
        
        -- Add comment explaining the purpose of the address column
        COMMENT ON COLUMN email.address IS 'Email address for email service configuration and routing purposes';
        
        RAISE NOTICE 'Added address column to email table';
    ELSE
        RAISE NOTICE 'Column address already exists in email table, skipping';
    END IF;
END $$;

-- Create index on address column for efficient email address lookups
-- Email addresses are frequently queried for validation, routing, and management
DO $$ 
BEGIN
    -- Check if index doesn't exist before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'email' 
        AND indexname = 'idx_email_address'
    ) THEN
        CREATE INDEX idx_email_address ON email(address);
        
        COMMENT ON INDEX idx_email_address IS 'Index on email address for efficient lookups and email routing queries';
        
        RAISE NOTICE 'Created index on email.address column';
    ELSE
        RAISE NOTICE 'Index on email.address already exists, skipping';
    END IF;
END $$;

-- Optional: Create unique index if email addresses should be unique in this table
-- Uncomment the following block if email addresses must be unique
/*
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'email' 
        AND indexname = 'idx_email_address_unique'
    ) THEN
        CREATE UNIQUE INDEX idx_email_address_unique ON email(address) 
        WHERE address IS NOT NULL;
        
        COMMENT ON INDEX idx_email_address_unique IS 'Unique constraint on email address to prevent duplicates';
        
        RAISE NOTICE 'Created unique index on email.address column';
    ELSE
        RAISE NOTICE 'Unique index on email.address already exists, skipping';
    END IF;
END $$;
*/

-- Update table comment to reflect the new column
COMMENT ON TABLE email IS 'Email service configuration table storing email types, labels, and addresses for routing and management';

-- Verify the migration by checking the new column exists
DO $$
DECLARE
    address_column_exists BOOLEAN;
BEGIN
    -- Check if address column now exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email' 
        AND column_name = 'address'
        AND table_schema = 'public'
    ) INTO address_column_exists;
    
    IF address_column_exists THEN
        RAISE NOTICE '✅ Migration successful: address column added to email table';
    ELSE
        RAISE WARNING '⚠️  Migration verification failed: address column may not have been created properly';
    END IF;
END $$;

COMMIT; 