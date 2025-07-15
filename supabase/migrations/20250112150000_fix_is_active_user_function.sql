-- Fix the is_active_user function to use the correct column
-- The function was looking for 'user_status' which doesn't exist
-- users_private table actually has 'onboard_status' (numeric)

CREATE OR REPLACE FUNCTION is_active_user(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return true if user has completed sufficient onboarding
    -- Allow access for users with onboard_status >= 30
    RETURN EXISTS (
        SELECT 1 
        FROM users_private 
        WHERE user_id = user_uuid 
        AND onboard_status >= 30
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If users_private table doesn't exist or any error occurs, return false
        RETURN FALSE;
END;
$$; 