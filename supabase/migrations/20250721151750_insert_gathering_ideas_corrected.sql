-- Migration: Insert gathering_ideas data (CORRECTED)
-- Maps "Walk" → "Outing" since Walk doesn't exist in experience_type table

-- First, delete any existing incomplete data from previous attempt
DELETE FROM public.gathering_ideas WHERE created_at > NOW() - INTERVAL '1 hour';

-- Create lookup CTEs with label mapping
WITH experience_lookup AS (
  SELECT id, label FROM experience_type
  UNION ALL
  -- Map "Walk" to "Outing" since Walk doesn't exist
  SELECT id, 'Walk' as label FROM experience_type WHERE label = 'Outing'
),
category_lookup AS (
  SELECT id, label FROM gathering_idea_categories
),
-- Raw data from spreadsheet
raw_data AS (
  VALUES
    ('Happiest moment', 'Before the gathering, please send your host a picture that shows one of your happiest/best moments in the last year. ', 'Before gathering, guests share a pic of their happiest moment in the last year; the host collates them', 'Before the gathering, I wanted to ask everyone to send me a picture of one of the happiest moments you had in the last year. ', 'Project has guests share moment of reflection and helps them learn about each other', 'Supper Club, Walk, Happy Hour, Other', 'Using Photos'),
    ('Personal history', 'Before the gathering, please send your host a picture that tells an important part of your personal history. ', 'Before gathering, guests share a pic of that tells an important part of their personal history; the host collates them', 'Before the gathering, I wanted to ask everyone to send me a picture of that in some way tells the story of an important part of your history. We''ll check them out together at the gathering. ', 'Guests share experience of refection; interpreting meaning of pics kicks off conversation', 'Supper Club, Walk, Happy Hour, Other', 'Using Photos'),
    ('Diner en blanc', 'To attend, please make sure you dress all in white, as elegantly as possible.', 'Guests need to arrive in elegant and entirely white attire. Google "Diner en blanc" to get a sense of how this works!', 'We ask that guests come dressed all in white-- and elegantly.  To get a sense of how this works, google "Diner en Blanc." ', 'Guests enjoy common experience of dressing up; makes evening elegant', 'Supper Club', 'Food and Dress'),
    ('Costume party', 'Please come dressed up...', 'Pick your favorite costume party theme (keep it easy enough so people don''t need to shop too much)', NULL, 'Guests enjoy shared experience of dressing up and are more invested in the gathering', 'Supper Club', 'Food and Dress'),
    ('No shop talk', NULL, 'You make a rule for your gathering: no talking about work. Or "anyone who talks about work needs to take a shot."', 'There''s one rule for the gathering: we ask the guests refrain about talking about work for the evening.', 'Gets guests out of the easiest conversation and pushes them into more meaningful ones.', 'Supper Club, Walk, Happy Hour, Other', 'Creative Rules'),
    ('No pouring for yourself', NULL, 'Add a simple rule to your gathering: nobody is allowed to pour a drink for themselves. ', NULL, 'It gives a reason for guests to connect and do a little something for each other.', 'Supper Club', 'Creative Rules'),
    ('Potluck with a story', 'Please bring some food to the potluck that relates to their past in some way. ', 'Ask that everyone bring some food to the potluck that relates to their past in some way. ', 'We ask that everyone bring some food to the potluck that relates to their past in some way. ', 'Guests share experience of choosing food and enjoy figuring out story.', 'Supper Club', 'Food and Dress'),
    ('Special cuisine', NULL, 'Choose a cuisine that''s meaningful to you and go all out.  ', NULL, 'Guests will be thankful for your cooking and it will make everyone feel connected', 'Supper Club', 'Food and Dress'),
    ('Toast rounds', 'Guests are encouraged to make a short toast to each other before eating and drinking. We''ll share details at the event.', 'Encourage members to each toast the group by sharing a story on a theme, like "to friendship," "to mistakes," "to learning," "to discovery," or "to botching." Two minutes each.', 'Guests will be encouraged to share a short toast with each other before we eat.', 'Guests will learn something new about each other and find points of common experience.', 'Supper Club, Happy Hour', 'Toasts and Sharing'),
    ('What we''re learning', 'Guests will be asked to share something that they are currently trying to learn that''s not related to work.', 'Ask members to share something that they are working on learning that''s not directly related to work. ', 'Guests are asked to share something that they are currently trying to learn that''s not related to work.', 'Guests get a window into what matters to each other and find new things to learn.', 'Supper Club, Walk, Happy Hour, Other', 'Toasts and Sharing'),
    ('Unheard stories', NULL, 'Ask your guests to share a story with another guest (or the whole group) that they haven''t told to anyone before.', 'As a way of helping everyone learn something new about each other, we wanted to ask that each person share a story with at least one other guest that they''ve never shared before. ', NULL, 'Walk, Other', 'Toasts and Sharing')
),
-- Split comma-delimited experience types and create arrays
processed_data AS (
  SELECT 
    rd.column1 as label,
    rd.column2 as signup_text, 
    rd.column3 as overview,
    rd.column4 as description_text,
    rd.column5 as why,
    -- Split experience_type by comma and lookup UUIDs (with Walk mapping)
    ARRAY(
      SELECT DISTINCT el.id 
      FROM unnest(string_to_array(rd.column6, ',')) as exp_type(label)
      JOIN experience_lookup el ON TRIM(exp_type.label) = el.label
      WHERE TRIM(exp_type.label) != '' AND el.id IS NOT NULL
    ) as experience_type_ids,
    -- Lookup single category UUID
    ARRAY[cl.id] as category_ids
  FROM raw_data rd
  LEFT JOIN category_lookup cl ON TRIM(rd.column7) = cl.label
  WHERE cl.id IS NOT NULL -- Only process rows with valid categories
)
-- Insert the processed data
INSERT INTO public.gathering_ideas (
  label,
  signup_text,
  overview,
  description_text,
  why,
  experience_type,
  gathering_idea_category,
  tag,
  created_at,
  updated_at
)
SELECT 
  pd.label,
  pd.signup_text,
  pd.overview,
  pd.description_text,
  pd.why,
  pd.experience_type_ids,
  pd.category_ids,
  NULL as tag,
  NOW(),
  NOW()
FROM processed_data pd
WHERE pd.experience_type_ids IS NOT NULL 
  AND pd.category_ids IS NOT NULL
  AND array_length(pd.experience_type_ids, 1) > 0
  AND array_length(pd.category_ids, 1) > 0;

-- Report results
DO $$
DECLARE
  inserted_count INTEGER;
  total_count INTEGER;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  SELECT count(*) INTO total_count FROM gathering_ideas;
  
  RAISE NOTICE '✅ SUCCESS: Inserted % new gathering ideas', inserted_count;
  RAISE NOTICE '📊 Total gathering_ideas in database: %', total_count;
  RAISE NOTICE '🔄 Mapping applied: "Walk" → "Outing" experience type';
  RAISE NOTICE '🎯 Experience types converted from comma-delimited strings to UUID arrays';
  RAISE NOTICE '📂 Categories mapped from labels to UUID arrays';
END $$; 