-- Migration: Create user admin and active functions
-- Date: 2025-07-13 07:17:08 (before all planned_workflow migrations)
-- Description: Creates both user admin and active functions that are needed by later migrations

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM users_internal 
        WHERE user_id = auth.uid() 
        AND user_status = 'admin'
    );
$$;

-- Function to check if current user is active
CREATE OR REPLACE FUNCTION is_current_user_active()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM users_internal 
        WHERE user_id = auth.uid() 
        AND (user_status = 'active' OR user_status = 'admin')
    );
$$; 