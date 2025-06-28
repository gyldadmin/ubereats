-- Migration: Rename tables
-- Created: 2025-06-27 15:32:26
-- Description: Rename "nomination" to "nominations" and "metros" to "metro"

-- Rename nomination table to nominations
ALTER TABLE public.nomination RENAME TO nominations;

-- Rename metros table to metro
ALTER TABLE public.metros RENAME TO metro;

-- Update RLS policy names for nominations table to reflect new table name
-- (The policies will automatically apply to the renamed table, but updating names for clarity)

-- Drop old policies with old names
DROP POLICY IF EXISTS "nomination_read_public" ON public.nominations;
DROP POLICY IF EXISTS "nomination_insert_own" ON public.nominations;
DROP POLICY IF EXISTS "nomination_update_own" ON public.nominations;
DROP POLICY IF EXISTS "nomination_delete_own" ON public.nominations;

-- Create new policies with updated names
CREATE POLICY "nominations_read_public" ON public.nominations
    FOR SELECT
    USING (true);

CREATE POLICY "nominations_insert_own" ON public.nominations
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR public.is_current_user_admin()
    );

CREATE POLICY "nominations_update_own" ON public.nominations
    FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR public.is_current_user_admin()
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR public.is_current_user_admin()
    );

CREATE POLICY "nominations_delete_own" ON public.nominations
    FOR DELETE
    USING (
        auth.uid() = user_id 
        OR public.is_current_user_admin()
    );

-- Update RLS policy names for metro table to reflect new table name
-- Drop old policies with old names
DROP POLICY IF EXISTS "metros_read_public" ON public.metro;
DROP POLICY IF EXISTS "metros_insert_admin" ON public.metro;
DROP POLICY IF EXISTS "metros_update_admin" ON public.metro;
DROP POLICY IF EXISTS "metros_delete_admin" ON public.metro;

-- Create new policies with updated names
CREATE POLICY "metro_read_public" ON public.metro
    FOR SELECT
    USING (true);

CREATE POLICY "metro_insert_admin" ON public.metro
    FOR INSERT
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "metro_update_admin" ON public.metro
    FOR UPDATE
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "metro_delete_admin" ON public.metro
    FOR DELETE
    USING (public.is_current_user_admin()); 