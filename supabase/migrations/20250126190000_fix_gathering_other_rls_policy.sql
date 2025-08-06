-- Migration: Fix gathering_other table RLS policy to allow service role access
-- Date: 2025-01-26 19:00:00
-- Description: Update RLS policy to allow service role to insert gathering_other records via triggers

-- Drop the restrictive active-user-only policies
DROP POLICY IF EXISTS "gathering_other_insert_active_users" ON gathering_other;
DROP POLICY IF EXISTS "gathering_other_update_active_users" ON gathering_other;
DROP POLICY IF EXISTS "gathering_other_delete_active_users" ON gathering_other;

-- Create new policies that allow both active users AND service role
CREATE POLICY "gathering_other_insert_policy" ON gathering_other
    FOR INSERT
    WITH CHECK (
        public.is_active_user() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "gathering_other_update_policy" ON gathering_other
    FOR UPDATE
    USING (
        public.is_active_user() OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        public.is_active_user() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "gathering_other_delete_policy" ON gathering_other
    FOR DELETE
    USING (
        public.is_active_user() OR 
        auth.role() = 'service_role'
    );


-- Also fix gathering_displays RLS policy for service role access
DROP POLICY IF EXISTS "gathering_displays_modify_authenticated" ON gathering_displays;

CREATE POLICY "gathering_displays_insert_policy" ON gathering_displays
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "gathering_displays_update_policy" ON gathering_displays
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        auth.uid() IS NOT NULL OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "gathering_displays_delete_policy" ON gathering_displays
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL OR 
        auth.role() = 'service_role'
    );
