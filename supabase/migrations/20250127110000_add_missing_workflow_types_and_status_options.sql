-- Add missing workflow types that the scheduler expects
INSERT INTO workflow_type (label) VALUES 
  ('orchestration'),
  ('database_update'),
  ('custom'),
  ('individual_email')
ON CONFLICT (label) DO NOTHING;

-- Add missing status options that the scheduler expects
INSERT INTO status_options (label) VALUES 
  ('processing'),
  ('failed')
ON CONFLICT (label) DO NOTHING;
