-- Migration: Add mentoring_how_it_works content template
-- Date: 2025-07-11 17:00:10
-- Description: Inserts content template for EventDetailScreen How Mentoring Salons Work

-- Insert the mentoring_how_it_works content template
INSERT INTO content_templates (
    content_key,
    content_type,
    usage_context,
    dynamic_variables,
    primary_text,
    secondary_text
) VALUES (
    'mentoring_how_it_works',
    'display',
    'EventDetailScreen How Mentoring Salons Work - teaser and detail',
    '[
        {
            "variable": "{{gyld_type_@}}",
            "description": "gyld_type.@ for gatherings'' gyldtype"
        }
    ]'::jsonb,
    'The purpose of a salon is to help you to deepen your expertise is a specific sub-discipline of {{gyld_type_@}}. You''ll work through a novel problem under the guidance of your mentor, who''ll share feedback on how you think.',
    '**Problem.** Your mentor will share a problem, usually without giving a lot of context. Your goal for the salon is to solve the problem. 

**Fact Base.** You''ll ask mentor questions to build context. Unless you ask, won''t get the information you need to solve the problem. 

**Exploration.** You''ll explore different dimension of the problem. Often, your mentor will give you some prompts to guide your thinking.  

**Solutions.** You''ll share your ideas and solutions, and your mentor will offer feedback, aiming to deepen your mentals models.

**Open Space.** At the end of the salon, the host and mentor choose how they want to use the time. Examples include an AMA or a sounding bound session where a gyld member will share a challenge they are facing for feedback.'
); 