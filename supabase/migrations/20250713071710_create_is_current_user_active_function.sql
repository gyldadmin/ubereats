-- Migration: Create is_current_user_active function
-- Date: 2025-07-13 07:17:10 (same minute as planned_workflows)
-- Description: Creates is_current_user_active function that was missing from foundation schema

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