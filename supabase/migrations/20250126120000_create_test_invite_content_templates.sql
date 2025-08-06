-- Migration: Create test invite content templates
-- Date: 2025-01-26 12:00:00
-- Description: Creates content templates for test gathering invitation (push and email)

-- Insert push notification template
INSERT INTO content_templates (
    content_key,
    content_type,
    usage_context,
    dynamic_variables,
    primary_text,
    secondary_text,
    tertiary_text
) VALUES (
    'test_invite',
    (SELECT id FROM workflow_type WHERE label = 'push'),
    'Push notification sent to Gyld members when invited to an event',
    '[
        {"variable": "gathering_title", "description": "Title of the gathering/event"},
        {"variable": "host_name", "description": "Name of the person hosting the event"},
        {"variable": "experience_type", "description": "Type of experience (Happy Hour, Course, etc.)"},
        {"variable": "gathering_date", "description": "Formatted date and time of the event"},
        {"variable": "gathering_location", "description": "Location where the event takes place"}
    ]'::jsonb,
    'You''re invited: {{gathering_title}}',
    'Hosted by {{host_name}}',
    'Join us for {{experience_type}} on {{gathering_date}} at {{gathering_location}}'
);

-- Insert email template
INSERT INTO content_templates (
    content_key,
    content_type,
    usage_context,
    dynamic_variables,
    primary_text,
    secondary_text,
    tertiary_text
) VALUES (
    'test_invite',
    (SELECT id FROM workflow_type WHERE label = 'email'),
    'Email sent to Gyld members when invited to an event',
    '[
        {"variable": "gathering_title", "description": "Title of the gathering/event"},
        {"variable": "host_name", "description": "Name of the person hosting the event"},
        {"variable": "first_name", "description": "Recipient''s first name"},
        {"variable": "gathering_date", "description": "Formatted date and time of the event"},
        {"variable": "gathering_location", "description": "Location where the event takes place"},
        {"variable": "attendee_count", "description": "Number of people currently attending"}
    ]'::jsonb,
    'You''re invited: {{gathering_title}}',
    'Hi {{first_name}}, you''re invited to join {{gathering_title}} hosted by {{host_name}}',
    'Event Details: {{gathering_date}} at {{gathering_location}}. {{attendee_count}} people are already interested!'
); 