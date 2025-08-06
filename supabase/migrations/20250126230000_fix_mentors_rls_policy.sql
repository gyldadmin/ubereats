-- Migration: Fix mentors table RLS policy to allow authenticated users
-- Date: 2025-01-26 23:00:00
-- Description: Allow authenticated users to create mentor records

-- Drop the restrictive admin-only policies
DROP POLICY IF EXISTS "mentors_insert_policy" ON mentors;
DROP POLICY IF EXISTS "mentors_update_policy" ON mentors;
DROP POLICY IF EXISTS "mentors_delete_policy" ON mentors;

-- Create new policies that allow authenticated users to manage mentors
CREATE POLICY "mentors_insert_policy" ON mentors
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "mentors_update_policy" ON mentors
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        auth.uid() IS NOT NULL OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "mentors_delete_policy" ON mentors
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL OR 
        auth.role() = 'service_role'
    );