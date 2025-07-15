-- Create planned_workflows table
-- This table stores workflows that users have planned (email reminders, push notifications, SMS)

-- Create the table
CREATE TABLE planned_workflows (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL,
    planned_workflow_type UUID NOT NULL REFERENCES planned_workflow_types(id) ON DELETE RESTRICT,
    gathering_id UUID REFERENCES gatherings(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_planned_workflows_user_id ON planned_workflows(user_id);
CREATE INDEX idx_planned_workflows_workflow_id ON planned_workflows(workflow_id);
CREATE INDEX idx_planned_workflows_type ON planned_workflows(planned_workflow_type);
CREATE INDEX idx_planned_workflows_gathering_id ON planned_workflows(gathering_id);

-- Add trigger to automatically update updated_at field
CREATE TRIGGER update_planned_workflows_updated_at 
    BEFORE UPDATE ON planned_workflows 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE planned_workflows ENABLE ROW LEVEL SECURITY;

-- Note: Using existing is_current_user_active() function from foundation schema

-- RLS Policies

-- READ PERMISSIONS: Active Users Only (can read their own records)
CREATE POLICY "Active users read own planned_workflows"
    ON planned_workflows
    FOR SELECT
    TO authenticated
    USING (
        is_current_user_active() 
        AND user_id = auth.uid()
    );

-- WRITE PERMISSIONS: Active Users (can manage their own records)
CREATE POLICY "Active users insert own planned_workflows"
    ON planned_workflows
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_current_user_active() 
        AND user_id = auth.uid()
    );

CREATE POLICY "Active users update own planned_workflows"
    ON planned_workflows
    FOR UPDATE
    TO authenticated
    USING (
        is_current_user_active() 
        AND user_id = auth.uid()
    )
    WITH CHECK (
        is_current_user_active() 
        AND user_id = auth.uid()
    );

CREATE POLICY "Active users delete own planned_workflows"
    ON planned_workflows
    FOR DELETE
    TO authenticated
    USING (
        is_current_user_active() 
        AND user_id = auth.uid()
    );

-- Add helpful comments
COMMENT ON TABLE planned_workflows IS 'Workflows that users have planned for gatherings (email reminders, push notifications, SMS)';
COMMENT ON COLUMN planned_workflows.user_id IS 'The user who created this planned workflow';
COMMENT ON COLUMN planned_workflows.workflow_id IS 'Unique identifier for the specific workflow instance';
COMMENT ON COLUMN planned_workflows.planned_workflow_type IS 'Type of workflow (Email, Push, SMS) - references planned_workflow_types';
COMMENT ON COLUMN planned_workflows.gathering_id IS 'Optional gathering this workflow is associated with'; 