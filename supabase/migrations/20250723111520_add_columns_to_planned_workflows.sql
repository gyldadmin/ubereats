-- Migration: Add new columns to planned_workflows table
-- Created: 2025-01-23 11:15:20
-- 
-- This migration adds the following columns to the planned_workflows table:
-- - status: References status_options table for workflow status tracking
-- - candidate_id: References candidates table for candidate-specific workflows
-- - description: Text field for workflow explanation/notes

BEGIN;

-- Add status column with foreign key to status_options
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'planned_workflows' AND column_name = 'status'
    ) THEN
        ALTER TABLE planned_workflows 
        ADD COLUMN status UUID REFERENCES status_options(id);
        
        -- Add comment for status column
        COMMENT ON COLUMN planned_workflows.status IS 'References status_options table - current status of the planned workflow';
    END IF;
END $$;

-- Add candidate_id column with foreign key to candidates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'planned_workflows' AND column_name = 'candidate_id'
    ) THEN
        ALTER TABLE planned_workflows 
        ADD COLUMN candidate_id UUID REFERENCES candidates(id);
        
        -- Add comment for candidate_id column
        COMMENT ON COLUMN planned_workflows.candidate_id IS 'References candidates table - specific candidate this workflow applies to';
    END IF;
END $$;

-- Add description column for workflow explanation
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'planned_workflows' AND column_name = 'description'
    ) THEN
        ALTER TABLE planned_workflows 
        ADD COLUMN description TEXT;
        
        -- Add comment for description column
        COMMENT ON COLUMN planned_workflows.description IS 'Text explanation of what this workflow does and when it should be executed';
    END IF;
END $$;

-- Create indexes for foreign key columns to improve query performance
-- Index for status column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'planned_workflows' AND indexname = 'idx_planned_workflows_status'
    ) THEN
        CREATE INDEX idx_planned_workflows_status ON planned_workflows(status);
    END IF;
END $$;

-- Index for candidate_id column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'planned_workflows' AND indexname = 'idx_planned_workflows_candidate_id'
    ) THEN
        CREATE INDEX idx_planned_workflows_candidate_id ON planned_workflows(candidate_id);
    END IF;
END $$;

-- Add table comment to document the changes
COMMENT ON TABLE planned_workflows IS 'Stores planned workflow executions with status tracking, candidate associations, and descriptive information. Updated to include additional foreign key relationships and status tracking.';

COMMIT; 