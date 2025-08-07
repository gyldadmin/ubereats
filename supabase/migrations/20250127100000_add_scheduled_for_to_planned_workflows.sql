-- Migration: Add scheduled_for column to planned_workflows table
-- Date: 2025-01-27 10:00:00
-- Purpose: Add the scheduled_for column required by the CentralScheduler

-- Add the scheduled_for column to store when the workflow should be executed
ALTER TABLE planned_workflows 
ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying of scheduled tasks
CREATE INDEX idx_planned_workflows_scheduled_for ON planned_workflows(scheduled_for);

-- Create composite index for common scheduler queries (status + scheduled_for)
CREATE INDEX idx_planned_workflows_status_scheduled_for ON planned_workflows(status, scheduled_for);

-- Add helpful comment
COMMENT ON COLUMN planned_workflows.scheduled_for IS 'Timestamp when this workflow should be executed by the central scheduler';

-- Update any existing records to have a reasonable scheduled_for value
-- (Set to created_at + 1 minute for existing records, or leave NULL if they should not be scheduled)
UPDATE planned_workflows 
SET scheduled_for = created_at + INTERVAL '1 minute'
WHERE scheduled_for IS NULL 
  AND status IN (
    SELECT id FROM status_options WHERE label = 'pending'
  );