-- Update mentoring_scribe_role content template to remove dynamic_variables
UPDATE content_templates 
SET dynamic_variables = NULL
WHERE content_key = 'mentoring_scribe_role'; 