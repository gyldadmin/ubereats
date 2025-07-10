-- Add 'social' experience type to experience_type table
INSERT INTO experience_type (id, created_at, updated_at, label, category)
VALUES (
    gen_random_uuid(),
    NOW(),
    NOW(),
    'social',
    '62a6c251-aeb4-4f7b-8462-09339b9de9a2'
); 