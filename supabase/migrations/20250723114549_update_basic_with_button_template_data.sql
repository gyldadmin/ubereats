-- Migration: Update basic_with_button template data
-- Date: 2025-01-23 11:45:49
-- Description: Updates the basic_with_button email template with enhanced variable list and JSON template
-- including support for CC, BCC, and multiple recipients

BEGIN;

-- Update the basic_with_button template with enhanced template_variables and json_template
UPDATE email_template_ids 
SET 
    template_variables = ARRAY[
        'body1', 
        'subject', 
        'buttonurl', 
        'buttontext', 
        'unsubscribeurl', 
        'to_addresses', 
        'cc_addresses', 
        'bcc_addresses', 
        'sender_email', 
        'sender_fullname', 
        'reply_to_address', 
        'template_id'
    ],
    json_template = '{
        "personalizations": [{
            "to": "{{to_addresses}}",
            "cc": "{{cc_addresses}}",
            "bcc": "{{bcc_addresses}}",
            "dynamic_template_data": {
                "body1": "{{body1}}",
                "subject": "{{subject}}",
                "buttonurl": "{{buttonurl}}",
                "buttontext": "{{buttontext}}",
                "unsubscribeurl": "{{unsubscribeurl}}"
            }
        }],
        "from": {
            "email": "{{sender_email}}",
            "name": "{{sender_fullname}}"
        },
        "reply_to": {
            "email": "{{reply_to_address}}"
        },
        "template_id": "{{template_id}}"
    }'::jsonb,
    updated_at = NOW()
WHERE label = 'basic_with_button';

-- Verify the update was successful
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Check if the update was applied
    SELECT COUNT(*) INTO updated_count
    FROM email_template_ids 
    WHERE label = 'basic_with_button' 
    AND template_variables IS NOT NULL 
    AND json_template IS NOT NULL;
    
    IF updated_count = 1 THEN
        RAISE NOTICE '✅ Successfully updated basic_with_button template data with % variables and JSON template', 
            (SELECT array_length(template_variables, 1) FROM email_template_ids WHERE label = 'basic_with_button');
    ELSE
        RAISE WARNING '⚠️  Update may have failed - basic_with_button template not found or data not set properly';
    END IF;
END $$;

-- Add comment to document the change
COMMENT ON TABLE email_template_ids IS 'Email template configurations with template variables and JSON structures. Updated basic_with_button template with CC/BCC support and enhanced variable mapping.';

COMMIT; 