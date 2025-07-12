-- Add mentoring_scribe_role content template
INSERT INTO content_templates (
    content_key,
    content_type,
    usage_context,
    dynamic_variables,
    primary_text,
    secondary_text
) VALUES (
    'mentoring_scribe_role',
    'display',
    'EventDetailScreen Your Role: Salon Scribe - teaser and detail',
    '{"{{gyld_type_@}}": "[gyld_type.@ for gatherings'' gyldtype]"}'::jsonb,
    'As scribe, you''re the steward of knowledge created in the salon.  You''ll record the most important insights that come out of the overall discussion. And you''ll also make note of specific gyld members who make valuable contributions.',
    '**Why Scribes Matter.** Scribes take knowledge generated from the salon and make it part of their gyld''s broader knowledge base. They also recognize members who make valuable contributions to the discussion. 

**Responsibilities.**
~ Recording the two or three most valuable insights and takeaways that came out of the discussion
~ Recognizing members who make valuable contributions to the discussion
~ (see notification after salon requesting your input)

**What You''ll Get.** Scribes give broader meaning to the salon-- your fellow members will appreciate your efforts.'
); 