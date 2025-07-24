-- Migration: Create temporary is_admin function
-- Date: 2025-07-07 09:56:28 (1 second before gathering_status table)
-- Description: Creates temporary is_admin function to allow migrations to proceed
-- This will be updated once users_private table is created

-- Temporary is_admin function to allow migrations to proceed
-- This will be updated once the users_private table is created
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- For now, only allow service_role to perform admin actions
    -- This will be updated once users_private table exists
    RETURN auth.role() = 'service_role';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$; 