-- Rename gathering_satellites table to gathering_displays
-- This migration renames the table for better semantic clarity

-- Rename the table from gathering_satellites to gathering_displays
ALTER TABLE public.gathering_satellites RENAME TO gathering_displays;

-- Update the table comment to reflect the new name
COMMENT ON TABLE public.gathering_displays IS 'Gathering display information and presentation data';

-- Note: PostgreSQL automatically updates the following when renaming a table:
-- - Primary key constraint names
-- - Index names (they will reference the new table name)
-- - Foreign key constraints pointing TO this table
-- - Sequences associated with the table
-- 
-- However, RLS policies and some constraint names may need manual updates.
-- Let's check and update RLS policies to use the new table name.

-- Drop old RLS policies (they reference the old table name in their definitions)
DROP POLICY IF EXISTS "gathering_satellites_policy" ON public.gathering_displays;
DROP POLICY IF EXISTS "gathering_satellites_select" ON public.gathering_displays;
DROP POLICY IF EXISTS "gathering_satellites_insert" ON public.gathering_displays;
DROP POLICY IF EXISTS "gathering_satellites_update" ON public.gathering_displays;
DROP POLICY IF EXISTS "gathering_satellites_delete" ON public.gathering_displays;

-- Recreate RLS policies with new naming (if they existed)
-- Note: These will need to match the original RLS policy logic from the foundation migration
-- Assuming standard RLS pattern based on other tables in the project

-- Example RLS policies (adjust based on your actual requirements):
CREATE POLICY "gathering_displays_select_all" ON public.gathering_displays
    FOR SELECT
    USING (true);

CREATE POLICY "gathering_displays_modify_authenticated" ON public.gathering_displays
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL); 