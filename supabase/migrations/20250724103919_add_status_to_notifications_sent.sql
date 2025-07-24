-- Migration: Add status column to notifications_sent
-- Date: 2025-01-24 10:39:19
-- Description: Adds status column to track notification delivery status (sent/failed)

-- Add status column to notifications_sent
ALTER TABLE notifications_sent 
ADD COLUMN status TEXT DEFAULT 'sent' NOT NULL;

-- Create index for status lookups
CREATE INDEX idx_notifications_sent_status ON notifications_sent(status);

-- Add check constraint to ensure valid status values
ALTER TABLE notifications_sent 
ADD CONSTRAINT notifications_sent_status_check 
CHECK (status IN ('sent', 'failed'));

-- Add helpful comment
COMMENT ON COLUMN notifications_sent.status IS 'Delivery status of the notification (sent/failed)'; 