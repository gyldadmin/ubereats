-- Migration: Consolidate workflow tables and update schema
-- Date: 2025-01-24 09:48:28
-- Description: Consolidates notification_type and planned_workflow_types into workflow_type,
-- updates all references, and adds new fields for push notifications and workflow data

-- Step 1: Rename notification_type to workflow_type
ALTER TABLE notification_type RENAME TO workflow_type;

-- Step 2: Update notifications_sent FK reference
ALTER TABLE notifications_sent 
DROP CONSTRAINT IF EXISTS notifications_sent_notification_type_fkey;

ALTER TABLE notifications_sent 
RENAME COLUMN notification_type TO workflow_type;

ALTER TABLE notifications_sent 
ADD CONSTRAINT notifications_sent_workflow_type_fkey 
FOREIGN KEY (workflow_type) REFERENCES workflow_type(id);

-- Step 3: Add 'display' row to workflow_type if not exists
INSERT INTO workflow_type (label) VALUES ('display')
ON CONFLICT (label) DO NOTHING;

-- Step 4: Update planned_workflows to reference workflow_type
-- First add the new column
ALTER TABLE planned_workflows 
ADD COLUMN workflow_type UUID REFERENCES workflow_type(id);

-- Step 5: Drop the old planned_workflow_type column (no data to migrate)
ALTER TABLE planned_workflows 
DROP COLUMN IF EXISTS planned_workflow_type;

-- Step 6: Drop planned_workflow_types table
DROP TABLE IF EXISTS planned_workflow_types CASCADE;

-- Step 7: Update content_templates.content_type to be UUID FK
-- First add new column
ALTER TABLE content_templates 
ADD COLUMN content_type_new UUID REFERENCES workflow_type(id);

-- Migrate existing data (both records should be 'display')
UPDATE content_templates 
SET content_type_new = (SELECT id FROM workflow_type WHERE label = 'display')
WHERE content_type = 'display';

-- Drop old column and rename new one
ALTER TABLE content_templates DROP COLUMN content_type;
ALTER TABLE content_templates RENAME COLUMN content_type_new TO content_type;

-- Make content_type NOT NULL
ALTER TABLE content_templates ALTER COLUMN content_type SET NOT NULL;

-- Step 8: Add push_token field to users_private
ALTER TABLE users_private 
ADD COLUMN push_token TEXT;

-- Create index for push_token lookups
CREATE INDEX idx_users_private_push_token ON users_private(push_token);

-- Step 9: Add workflow_data JSONB field to planned_workflows
ALTER TABLE planned_workflows 
ADD COLUMN workflow_data JSONB;

-- Add helpful comments
COMMENT ON TABLE workflow_type IS 'Unified workflow type lookup table for notifications, planned workflows, and content templates';
COMMENT ON COLUMN planned_workflows.workflow_type IS 'References workflow_type table - type of workflow (email, push, sms, display)';
COMMENT ON COLUMN planned_workflows.workflow_data IS 'Serialized inputs for workflow execution (EmailServiceInputs, PushServiceInputs, etc.)';
COMMENT ON COLUMN content_templates.content_type IS 'References workflow_type table - type of content (email, push, sms, display)';
COMMENT ON COLUMN users_private.push_token IS 'Expo push notification token for this user';

-- Update RLS policies comments
COMMENT ON POLICY "Public read access for notification_type" ON workflow_type IS 'Anyone can read workflow types';

-- Verification queries
SELECT 
    'workflow_type_rows' as table_name,
    COUNT(*) as row_count,
    array_agg(label ORDER BY label) as labels
FROM workflow_type
UNION ALL
SELECT 
    'content_templates_migrated' as table_name,
    COUNT(*) as row_count,
    NULL as labels
FROM content_templates 
WHERE content_type IS NOT NULL; 