-- Migration: Update invite template with envelope configuration
-- Date: 2025-01-23 19:00:00
-- Description: Updates the invite template to support personalized gathering invitations with envelope design

-- Update the invite template with new JSON template and variables
UPDATE email_template_ids 
SET 
  json_template = '{"from": {"name": "{{sender_fullname}}", "email": "{{sender_email}}"}, "reply_to": {"email": "{{reply_to_address}}"}, "template_id": "{{template_id}}", "personalizations": [{"cc": "{{cc_addresses}}", "to": "{{to_addresses}}", "bcc": "{{bcc_addresses}}", "dynamic_template_data": {"first": "{{first}}", "date": "{{gath_date}}", "title": "{{gath_title}}", "subtitle": "{{body1}}", "sub": "{{body2}}", "subject": "{{subject}}", "buttontext": "{{buttontext}}", "buttonurl": "{{buttonurl}}", "unsubscribeurl": "{{unsubscribeurl}}", "header_image": "{{header_image}}", "body_image": "{{body_image}}"}}]}',
  template_variables = ARRAY['first','gath_date','gath_title','body1','body2','subject','buttontext','buttonurl','unsubscribeurl','header_image','body_image','to_addresses','cc_addresses','bcc_addresses','sender_email','sender_fullname','reply_to_address','template_id']
WHERE label = 'invite';

-- Verify the update was successful
SELECT label, template_id, array_length(template_variables, 1) as variable_count
FROM email_template_ids 
WHERE label = 'invite'; 