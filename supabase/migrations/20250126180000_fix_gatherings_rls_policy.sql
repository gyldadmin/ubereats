-- Migration: Fix gatherings table RLS policy to allow authenticated users to create gatherings
-- Date: 2025-01-26 18:00:00
-- Description: Update RLS policy to allow authenticated users to insert/update/delete gatherings

-- Drop the restrictive admin-only policies
DROP POLICY IF EXISTS "gatherings_insert_policy" ON gatherings;
DROP POLICY IF EXISTS "gatherings_update_policy" ON gatherings;
DROP POLICY IF EXISTS "gatherings_delete_policy" ON gatherings;

-- Create new policies that allow authenticated users to manage gatherings
CREATE POLICY "gatherings_authenticated_users_insert" ON gatherings
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "gatherings_authenticated_users_update" ON gatherings
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "gatherings_authenticated_users_delete" ON gatherings
    FOR DELETE
    USING (auth.uid() IS NOT NULL); 