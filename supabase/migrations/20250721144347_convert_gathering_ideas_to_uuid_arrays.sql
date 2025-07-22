-- Migration: Convert gathering_ideas single UUID fields to UUID arrays
-- This allows multiple experience types and categories per gathering idea

-- First, let's see what we're working with
COMMENT ON COLUMN public.gathering_ideas.experience_type IS 'Converting from single UUID with FK to UUID array - multiple experience types supported';
COMMENT ON COLUMN public.gathering_ideas.gathering_idea_category IS 'Converting from single UUID with FK to UUID array - multiple categories supported';

-- Step 1: Drop existing foreign key constraints
-- These constraints prevent us from converting to arrays
DO $$
BEGIN
    -- Drop experience_type foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%gathering_ideas_experience_type%'
        AND table_name = 'gathering_ideas'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        EXECUTE 'ALTER TABLE public.gathering_ideas DROP CONSTRAINT ' || (
            SELECT constraint_name FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%gathering_ideas_experience_type%'
            AND table_name = 'gathering_ideas'
            AND constraint_type = 'FOREIGN KEY'
            LIMIT 1
        );
        RAISE NOTICE 'Dropped experience_type foreign key constraint';
    END IF;

    -- Drop gathering_idea_category foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%gathering_ideas_gathering_idea_category%'
        AND table_name = 'gathering_ideas'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        EXECUTE 'ALTER TABLE public.gathering_ideas DROP CONSTRAINT ' || (
            SELECT constraint_name FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%gathering_ideas_gathering_idea_category%'
            AND table_name = 'gathering_ideas'
            AND constraint_type = 'FOREIGN KEY'
            LIMIT 1
        );
        RAISE NOTICE 'Dropped gathering_idea_category foreign key constraint';
    END IF;
END $$;

-- Step 2: Drop existing indexes (we'll recreate them for arrays)
DROP INDEX IF EXISTS idx_gathering_ideas_experience_type;
DROP INDEX IF EXISTS idx_gathering_ideas_gathering_idea_category;

-- Step 3: Convert experience_type from UUID to UUID[]
-- First add a temporary column
ALTER TABLE public.gathering_ideas ADD COLUMN experience_type_temp UUID[];

-- Convert existing single UUIDs to single-element arrays
UPDATE public.gathering_ideas 
SET experience_type_temp = CASE 
    WHEN experience_type IS NOT NULL THEN ARRAY[experience_type]
    ELSE NULL
END;

-- Drop the old column and rename the new one
ALTER TABLE public.gathering_ideas DROP COLUMN experience_type;
ALTER TABLE public.gathering_ideas RENAME COLUMN experience_type_temp TO experience_type;

-- Step 4: Convert gathering_idea_category from UUID to UUID[]
-- First add a temporary column
ALTER TABLE public.gathering_ideas ADD COLUMN gathering_idea_category_temp UUID[];

-- Convert existing single UUIDs to single-element arrays
UPDATE public.gathering_ideas 
SET gathering_idea_category_temp = CASE 
    WHEN gathering_idea_category IS NOT NULL THEN ARRAY[gathering_idea_category]
    ELSE NULL
END;

-- Drop the old column and rename the new one
ALTER TABLE public.gathering_ideas DROP COLUMN gathering_idea_category;
ALTER TABLE public.gathering_ideas RENAME COLUMN gathering_idea_category_temp TO gathering_idea_category;

-- Step 5: Create GIN indexes for efficient array operations
-- These indexes support @>, && (overlaps), and other array operators
CREATE INDEX IF NOT EXISTS idx_gathering_ideas_experience_type_gin 
ON public.gathering_ideas USING GIN (experience_type);

CREATE INDEX IF NOT EXISTS idx_gathering_ideas_gathering_idea_category_gin 
ON public.gathering_ideas USING GIN (gathering_idea_category);

-- Step 6: Create partial indexes for non-null arrays (optional optimization)
CREATE INDEX IF NOT EXISTS idx_gathering_ideas_experience_type_notnull 
ON public.gathering_ideas USING GIN (experience_type) 
WHERE experience_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gathering_ideas_gathering_idea_category_notnull 
ON public.gathering_ideas USING GIN (gathering_idea_category) 
WHERE gathering_idea_category IS NOT NULL;

-- Step 7: Add comments explaining the new structure
COMMENT ON COLUMN public.gathering_ideas.experience_type IS 'Array of UUIDs referencing experience_type(id). Multiple experience types supported per gathering idea.';
COMMENT ON COLUMN public.gathering_ideas.gathering_idea_category IS 'Array of UUIDs referencing gathering_idea_categories(id). Multiple categories supported per gathering idea.';

-- Step 8: Add helpful examples for querying arrays
COMMENT ON TABLE public.gathering_ideas IS 'Updated to support multiple experience types and categories per idea. 

Query examples:
- Find ideas for specific experience type: WHERE experience_type @> ARRAY[''uuid-here'']::UUID[]
- Find ideas with any of multiple types: WHERE experience_type && ARRAY[''uuid1'', ''uuid2'']::UUID[]  
- Find ideas with specific category: WHERE gathering_idea_category @> ARRAY[''uuid-here'']::UUID[]
- Count experience types per idea: SELECT array_length(experience_type, 1) FROM gathering_ideas';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully converted gathering_ideas table:';
    RAISE NOTICE '- experience_type: UUID → UUID[] with GIN indexes';
    RAISE NOTICE '- gathering_idea_category: UUID → UUID[] with GIN indexes';
    RAISE NOTICE 'Table now supports multiple experience types and categories per gathering idea';
END $$; 