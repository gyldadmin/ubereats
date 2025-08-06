-- Migration: Fix RLS policies to properly handle service role context
-- Date: 2025-01-26 20:00:00
-- Description: Update RLS policies to work correctly when auth.uid() is NULL (service role)

-- The issue: is_active_user() fails when auth.uid() is NULL, even though we have OR auth.role() = 'service_role'
-- Solution: Check auth.role() first, then is_active_user()

-- Fix gathering_other policies
DROP POLICY IF EXISTS "gathering_other_insert_policy" ON gathering_other;
DROP POLICY IF EXISTS "gathering_other_update_policy" ON gathering_other;
DROP POLICY IF EXISTS "gathering_other_delete_policy" ON gathering_other;

CREATE POLICY "gathering_other_insert_policy" ON gathering_other
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR 
        public.is_active_user()
    );

CREATE POLICY "gathering_other_update_policy" ON gathering_other
    FOR UPDATE
    USING (
        auth.role() = 'service_role' OR 
        public.is_active_user()
    )
    WITH CHECK (
        auth.role() = 'service_role' OR 
        public.is_active_user()
    );

CREATE POLICY "gathering_other_delete_policy" ON gathering_other
    FOR DELETE
    USING (
        auth.role() = 'service_role' OR 
        public.is_active_user()
    );

-- Fix gathering_displays policies
DROP POLICY IF EXISTS "gathering_displays_insert_policy" ON gathering_displays;
DROP POLICY IF EXISTS "gathering_displays_update_policy" ON gathering_displays;
DROP POLICY IF EXISTS "gathering_displays_delete_policy" ON gathering_displays;

CREATE POLICY "gathering_displays_insert_policy" ON gathering_displays
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR 
        auth.uid() IS NOT NULL
    );

CREATE POLICY "gathering_displays_update_policy" ON gathering_displays
    FOR UPDATE
    USING (
        auth.role() = 'service_role' OR 
        auth.uid() IS NOT NULL
    )
    WITH CHECK (
        auth.role() = 'service_role' OR 
        auth.uid() IS NOT NULL
    );

CREATE POLICY "gathering_displays_delete_policy" ON gathering_displays
    FOR DELETE
    USING (
        auth.role() = 'service_role' OR 
        auth.uid() IS NOT NULL
    );
