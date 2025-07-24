-- Migration: Fix RLS policy for notifications_sent table
-- Date: 2025-01-23 16:40:17
-- Description: Allow authenticated users to record sent notifications for email service logging

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "notifications_sent_insert_policy" ON notifications_sent;
DROP POLICY IF EXISTS "notifications_sent_select_policy" ON notifications_sent;
DROP POLICY IF EXISTS "notifications_sent_update_policy" ON notifications_sent;
DROP POLICY IF EXISTS "notifications_sent_delete_policy" ON notifications_sent;

-- CREATE INSERT POLICY: Allow authenticated users to record notifications
CREATE POLICY "notifications_sent_insert_policy" ON notifications_sent
    FOR INSERT
    WITH CHECK (
        -- Allow authenticated users to insert notification records
        auth.role() = 'authenticated' OR
        auth.role() = 'service_role' OR
        -- Allow if user is admin
        is_current_user_admin()
    );

-- CREATE SELECT POLICY: Allow users to see notifications sent to their email
CREATE POLICY "notifications_sent_select_policy" ON notifications_sent  
    FOR SELECT
    USING (
        -- Users can see notifications sent to their email address
        auth.jwt()->>'email' = ANY(to_address) OR
        -- Admins can see all notifications
        is_current_user_admin() OR
        -- Service role can see all
        auth.role() = 'service_role'
    );

-- CREATE UPDATE POLICY: Only admins can update notification records
CREATE POLICY "notifications_sent_update_policy" ON notifications_sent
    FOR UPDATE
    USING (
        is_current_user_admin() OR
        auth.role() = 'service_role'
    );

-- CREATE DELETE POLICY: Only admins can delete notification records  
CREATE POLICY "notifications_sent_delete_policy" ON notifications_sent
    FOR DELETE
    USING (
        is_current_user_admin() OR
        auth.role() = 'service_role'
    );

-- Verify RLS is enabled on the table
ALTER TABLE notifications_sent ENABLE ROW LEVEL SECURITY;

-- Verification: Show the policies were created
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'notifications_sent'
ORDER BY policyname; 