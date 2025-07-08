-- Add organizer column to gyld table
-- Migration: 20250707143113_add_organizer_to_gyld
-- 
-- Purpose: Add organizer field to track users who are organizers of each gyld
-- This allows multiple users to have organizer permissions for a gyld

-- Check if the column already exists before adding it
DO $$
BEGIN
    -- Add organizer column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gyld' 
        AND column_name = 'organizer'
        AND table_schema = 'public'
    ) THEN
        -- Add the organizer column as UUID array with foreign key reference to auth.users
        ALTER TABLE gyld 
        ADD COLUMN organizer UUID[] DEFAULT '{}';
        
        -- Add comment to explain the column purpose
        COMMENT ON COLUMN gyld.organizer IS 'Array of user IDs who are organizers of this gyld. References auth.users(id)';
        
        RAISE NOTICE 'Added organizer column to gyld table';
    ELSE
        RAISE NOTICE 'Column organizer already exists in gyld table, skipping';
    END IF;
END $$;

-- Add foreign key constraint to ensure organizer UUIDs reference valid users
-- Note: PostgreSQL doesn't support array foreign keys directly, but we can add a check constraint
-- or handle validation at the application level

-- Add GIN index for efficient array operations on organizer column
-- This will improve performance when querying for gylds by organizer
DO $$
BEGIN
    -- Check if index already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'gyld' 
        AND indexname = 'idx_gyld_organizer_gin'
        AND schemaname = 'public'
    ) THEN
        -- Create GIN index for array operations
        CREATE INDEX idx_gyld_organizer_gin ON gyld USING GIN (organizer);
        
        RAISE NOTICE 'Created GIN index idx_gyld_organizer_gin on gyld.organizer';
    ELSE
        RAISE NOTICE 'Index idx_gyld_organizer_gin already exists, skipping';
    END IF;
END $$;

-- Add a helper function to validate organizer UUIDs (optional but recommended)
-- This ensures all UUIDs in the organizer array reference valid users
DO $$
BEGIN
    -- Create validation function if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_gyld_organizers') THEN
        CREATE OR REPLACE FUNCTION validate_gyld_organizers(organizer_ids UUID[])
        RETURNS BOOLEAN AS $func$
        BEGIN
            -- Check if all organizer IDs exist in auth.users
            IF organizer_ids IS NULL OR array_length(organizer_ids, 1) IS NULL THEN
                RETURN TRUE; -- Empty array is valid
            END IF;
            
            -- Verify all UUIDs exist in auth.users table
            RETURN NOT EXISTS (
                SELECT 1 
                FROM unnest(organizer_ids) AS organizer_id
                WHERE organizer_id NOT IN (SELECT id FROM auth.users)
            );
        END;
        $func$ LANGUAGE plpgsql;
        
        -- Add comment explaining the function
        COMMENT ON FUNCTION validate_gyld_organizers(UUID[]) IS 'Validates that all UUIDs in the organizer array reference existing users in auth.users';
        
        RAISE NOTICE 'Created validation function validate_gyld_organizers';
    ELSE
        RAISE NOTICE 'Function validate_gyld_organizers already exists, skipping';
    END IF;
END $$;

-- Add check constraint using the validation function (optional but recommended)
DO $$
BEGIN
    -- Add constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'gyld_organizer_valid_users'
        AND constraint_schema = 'public'
    ) THEN
        -- Add check constraint to validate organizer UUIDs
        ALTER TABLE gyld 
        ADD CONSTRAINT gyld_organizer_valid_users 
        CHECK (validate_gyld_organizers(organizer));
        
        RAISE NOTICE 'Added check constraint gyld_organizer_valid_users to gyld table';
    ELSE
        RAISE NOTICE 'Constraint gyld_organizer_valid_users already exists, skipping';
    END IF;
END $$;

-- Update existing gylds to have their current user_id as the first organizer (optional)
-- This maintains backward compatibility by making the creator also an organizer
DO $$
DECLARE 
    updated_count INTEGER;
BEGIN
    -- Update existing records where organizer is empty to include the user_id
    UPDATE gyld 
    SET organizer = ARRAY[user_id]
    WHERE organizer = '{}' OR organizer IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % existing gyld records to include user_id as organizer', updated_count;
END $$;

-- Summary of changes made:
-- ✅ Added organizer column as UUID[] to gyld table
-- ✅ Added GIN index for efficient array queries
-- ✅ Added validation function to ensure organizer UUIDs reference valid users
-- ✅ Added check constraint for data integrity
-- ✅ Updated existing records to maintain backward compatibility
-- ✅ Included proper IF NOT EXISTS checks to prevent conflicts
-- 
-- Usage examples after migration:
-- Query gylds where a specific user is an organizer:
--   SELECT * FROM gyld WHERE 'user_uuid' = ANY(organizer);
-- 
-- Add a new organizer to a gyld:
--   UPDATE gyld SET organizer = array_append(organizer, 'new_user_uuid') WHERE id = 'gyld_uuid';
-- 
-- Remove an organizer from a gyld:
--   UPDATE gyld SET organizer = array_remove(organizer, 'user_uuid') WHERE id = 'gyld_uuid'; 