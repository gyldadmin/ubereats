-- Migration: Update SendGrid template IDs for email templates
-- Date: 2025-01-23 15:20:33
-- Description: Updates the template_id values for invite_with_envelope and basic_with_button templates

-- Update invite_with_envelope template with new SendGrid template ID
UPDATE email_template_ids 
SET template_id = 'd-0b682a4542c94a5c8f50d7617536a26b'
WHERE label = 'invite_with_envelope';

-- Update basic_with_button template with new SendGrid template ID  
UPDATE email_template_ids
SET template_id = 'd-d8f6626620884c2fa06a3aee6a3ae01e'
WHERE label = 'basic_with_button';

-- Verification: Show the updated template IDs
SELECT 
    label,
    template_id,
    array_length(template_variables, 1) as variable_count
FROM email_template_ids 
WHERE label IN ('invite_with_envelope', 'basic_with_button')
ORDER BY label; 