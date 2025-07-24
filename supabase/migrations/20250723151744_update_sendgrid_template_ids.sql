-- Migration: Update SendGrid template IDs for email templates
-- Date: 2025-01-23 15:17:44
-- Description: Updates the actual SendGrid template IDs for invite_with_envelope and basic_with_button templates

-- Update invite_with_envelope template with actual SendGrid template ID
UPDATE email_template_ids 
SET template_id = 'd-0b682a4542c94a5c8f50d7617536a26b'
WHERE label = 'invite_with_envelope';

-- Update basic_with_button template with actual SendGrid template ID  
UPDATE email_template_ids 
SET template_id = 'd-d8f6626620884c2fa06a3aee6a3ae01e'
WHERE label = 'basic_with_button';

-- Verify the updates were successful
SELECT label, template_id, array_length(template_variables, 1) as variable_count
FROM email_template_ids 
WHERE label IN ('invite_with_envelope', 'basic_with_button')
ORDER BY label; 