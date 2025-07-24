-- Migration: Create is_current_user_admin function
-- Date: 2025-07-13 07:17:09 (1 second before planned_workflow_types)
-- Description: Creates is_current_user_admin function that was missing from foundation schema

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