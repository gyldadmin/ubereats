-- Create planned_workflow_types table
-- This table stores the different types of workflows that can be planned (Email, Push, SMS)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the table
CREATE TABLE planned_workflow_types (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE
);

-- Create index on label for faster lookups
CREATE INDEX idx_planned_workflow_types_label ON planned_workflow_types(label);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to automatically update updated_at field
CREATE TRIGGER update_planned_workflow_types_updated_at 
    BEFORE UPDATE ON planned_workflow_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE planned_workflow_types ENABLE ROW LEVEL SECURITY;

-- Note: Using existing is_current_user_admin() function from foundation schema

-- RLS Policies

-- READ PERMISSIONS: Public Access (anyone can read)
CREATE POLICY "Public read access on planned_workflow_types"
    ON planned_workflow_types
    FOR SELECT
    TO public
    USING (true);

-- WRITE PERMISSIONS: Admins Only
CREATE POLICY "Admin insert access on planned_workflow_types"
    ON planned_workflow_types
    FOR INSERT
    TO authenticated
    WITH CHECK (is_current_user_admin());

CREATE POLICY "Admin update access on planned_workflow_types"
    ON planned_workflow_types
    FOR UPDATE
    TO authenticated
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

CREATE POLICY "Admin delete access on planned_workflow_types"
    ON planned_workflow_types
    FOR DELETE
    TO authenticated
    USING (is_current_user_admin());

-- Insert initial data rows
INSERT INTO planned_workflow_types (label) VALUES 
    ('Email'),
    ('Push'),
    ('SMS');

-- Add helpful comments
COMMENT ON TABLE planned_workflow_types IS 'Types of workflows that can be planned - Email, Push notifications, SMS';
COMMENT ON COLUMN planned_workflow_types.label IS 'The display name for the workflow type (Email, Push, SMS)'; 