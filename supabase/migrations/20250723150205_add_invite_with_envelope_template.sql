-- Migration: Add invite_with_envelope email template configuration
-- Date: 2025-01-23 18:30:00
-- Description: Adds template configuration for invite emails with personalization fields

-- Insert the invite_with_envelope template configuration
INSERT INTO email_template_ids (
  label, 
  template_id, 
  template_variables, 
  json_template
) VALUES (
  'invite_with_envelope',
  'd-placeholder-invite-envelope',
  ARRAY['first','gath_date','gath_title','body1','body2','subject','buttontext','buttonurl','unsubscribeurl','header_image','body_image','to_addresses','cc_addresses','bcc_addresses','sender_email','sender_fullname','reply_to_address','template_id'],
  '{"from": {"name": "{{sender_fullname}}", "email": "{{sender_email}}"}, "reply_to": {"email": "{{reply_to_address}}"}, "template_id": "{{template_id}}", "personalizations": [{"cc": "{{cc_addresses}}", "to": "{{to_addresses}}", "bcc": "{{bcc_addresses}}", "dynamic_template_data": {"first": "{{first}}", "date": "{{gath_date}}", "title": "{{gath_title}}", "subtitle": "{{body1}}", "sub": "{{body2}}", "subject": "{{subject}}", "buttontext": "{{buttontext}}", "buttonurl": "{{buttonurl}}", "unsubscribeurl": "{{unsubscribeurl}}", "header_image": "{{header_image}}", "body_image": "{{body_image}}"}}]}'::jsonb
)
ON CONFLICT (label) DO UPDATE SET
  template_variables = EXCLUDED.template_variables,
  json_template = EXCLUDED.json_template,
  template_id = EXCLUDED.template_id; 