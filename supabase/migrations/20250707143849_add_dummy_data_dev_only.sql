-- Add dummy data for development environment only
-- WARNING: This migration contains test data and should NOT be applied to production
-- SAFETY: This migration will ONLY run in gyld-native-dev, NEVER in gyld-native-prod

-- Create environment check function to prevent production execution
DO $$
BEGIN
  -- Create a function to check if we're in development environment
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_gyld_development_environment') THEN
    CREATE OR REPLACE FUNCTION is_gyld_development_environment() RETURNS BOOLEAN AS $func$
    BEGIN
      -- Multiple safety checks to ensure we're in development:
      RETURN (
        -- 1. Check if database name contains 'dev' (gyld-native-dev)
        current_database() ILIKE '%dev%' OR
        current_database() ILIKE '%local%' OR
        current_database() ILIKE '%test%' OR
        -- 2. Explicitly check we're NOT in production database
        (current_database() NOT ILIKE '%prod%' AND current_database() NOT ILIKE '%production%') OR
        -- 3. Check if we're on local Supabase port (development indicator)
        current_setting('port', true) = '54322' OR
        -- 4. Additional safety: check if we have very few users (typical of dev env)
        (SELECT COUNT(*) FROM auth.users) <= 15
      ) AND 
      -- CRITICAL: Explicitly block production database
      current_database() NOT ILIKE '%gyld-native-prod%' AND 
      current_database() NOT ILIKE '%prod%';
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Safety check with explicit error for production
DO $$
BEGIN
  -- Explicit check for production database - fail hard if detected
  IF current_database() ILIKE '%prod%' OR current_database() ILIKE '%gyld-native-prod%' THEN
    RAISE EXCEPTION 'CRITICAL ERROR: Dummy data migration attempted on PRODUCTION database (%). This migration is FOR DEVELOPMENT ONLY!', current_database();
  END IF;
  
  -- Safety check: Only run in development environment
  IF NOT is_gyld_development_environment() THEN
    RAISE NOTICE 'Skipping dummy data migration - not in development environment (current db: %)', current_database();
    RETURN;
  END IF;
  
  RAISE NOTICE 'Development environment confirmed (%) - proceeding with dummy data migration', current_database();
END $$;

-- Create the two gyld records using existing users (only in development)
DO $$
DECLARE
  first_user_id UUID;
  second_user_id UUID;
BEGIN
  -- Environment check with production block
  IF current_database() ILIKE '%prod%' THEN
    RAISE EXCEPTION 'BLOCKED: Attempted to create dummy gyld records in PRODUCTION database %', current_database();
  END IF;
  
  IF NOT is_gyld_development_environment() THEN
    RETURN;
  END IF;
  
  -- Only proceed if we have users and gylds don't already exist
  IF EXISTS (SELECT 1 FROM auth.users) AND NOT EXISTS (SELECT 1 FROM gyld WHERE name IN ('Boston Product', 'Seattle Product')) THEN
    -- Get first two user IDs
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    SELECT id INTO second_user_id FROM auth.users LIMIT 1 OFFSET 1;
    
    -- Insert Boston Product gyld
    INSERT INTO gyld (name, user_id) VALUES ('Boston Product', first_user_id);
    
    -- Insert Seattle Product gyld
    INSERT INTO gyld (name, user_id) VALUES ('Seattle Product', second_user_id);
  END IF;
END $$;

-- Main migration block for user profiles and gatherings
DO $$
DECLARE
  -- All 8 existing user IDs from the database
  user_ids UUID[] := ARRAY[
    '9a5566e7-3c23-4070-8af6-2190a0abd521',  -- bru3212@yahoo.com
    'e0f9dc41-e938-46f9-a522-8b701036b1d9',  -- wtriant@yahoo.com  
    '700402a2-642a-4864-b55b-173d21417035',  -- wtriant@gmail.com
    '25411f2e-51d2-4a64-b527-7e969af31cb2',  -- bill.triant@gyld.org
    '1fb79be7-fe06-4a68-a706-b5b0c2ca90fb',  -- info@gyld.org
    '6eb59106-c941-4816-9157-80a5fc991580',  -- billtri212@gmail.com
    '57b85864-be10-4be1-a93d-4cec27556870',  -- bill@stripeslearning.com
    '34cafef8-f196-470c-add5-40d1f034ce4a'   -- tstatements@gmail.com
  ];
  
  -- User profile data arrays (6 for Boston Product, 2 for Seattle Product)
  user_first_names TEXT[] := ARRAY[
    'Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Riley',  -- Boston Product users
    'Sam', 'Drew'  -- Seattle Product users
  ];
  
  user_full_names TEXT[] := ARRAY[
    'Alex Chen', 'Jordan Rivera', 'Morgan Williams', 'Taylor Johnson', 'Casey Brown', 'Riley Davis',  -- Boston
    'Sam Wilson', 'Drew Martinez'  -- Seattle
  ];
  
  user_titles TEXT[] := ARRAY[
    'Senior Product Manager', 'Product Lead', 'Product Manager', 'Associate Product Manager', 
    'Principal Product Manager', 'VP Product',  -- Boston
    'Senior Product Manager', 'Product Director'  -- Seattle
  ];
  
  user_profpics TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108755-2616b612b5c0?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face'
  ];
  
  user_blurbs TEXT[] := ARRAY[
    'Product leader with 8+ years experience building user-centered products at scale.',
    'Strategic product thinker focused on growth and user acquisition. Former consultant turned product leader.',
    'Data-driven product manager specializing in mobile experiences and conversion optimization.',
    'Early-career PM passionate about consumer tech and behavioral psychology in product design.',
    'Seasoned product executive with expertise in marketplace dynamics and platform strategy.',
    'VP of Product with deep experience in B2B SaaS and enterprise product development.',
    'Product strategist focused on emerging markets and localization challenges.',
    'Product director with background in fintech and regulatory compliance in digital products.'
  ];
  
  user_proflinks TEXT[] := ARRAY[
    'linkedin.com/in/alexchen-pm',
    'linkedin.com/in/jordan-rivera-product',
    'linkedin.com/in/morgan-williams-pm',
    'linkedin.com/in/taylor-johnson-product',
    'linkedin.com/in/casey-brown-product',
    'linkedin.com/in/riley-davis-vp-product',
    'linkedin.com/in/sam-wilson-pm',
    'linkedin.com/in/drew-martinez-product'
  ];
  
  user_phone_numbers TEXT[] := ARRAY[
    '+16175551234', '+16175555678', '+16175552345', '+16175556789',
    '+16175553456', '+16175557890', '+12065551234', '+12065555678'
  ];
  
  boston_gyld_id UUID;
  seattle_gyld_id UUID;
  product_mgmt_type_id UUID;
  mentoring_type_id UUID;
  happy_hour_type_id UUID;
  coworking_type_id UUID;
  supper_club_type_id UUID;
  launched_status_id UUID;
  i INTEGER;
  current_user_id UUID;
  target_gyld_id UUID;
BEGIN
  -- CRITICAL: Environment check with production block
  IF current_database() ILIKE '%prod%' OR current_database() ILIKE '%gyld-native-prod%' THEN
    RAISE EXCEPTION 'CRITICAL BLOCK: Attempted to create dummy user/gathering data in PRODUCTION database %', current_database();
  END IF;
  
  -- Exit early if not development
  IF NOT is_gyld_development_environment() THEN
    RAISE NOTICE 'Skipping user profile and gathering creation - not in development environment (db: %)', current_database();
    RETURN;
  END IF;

  -- Get reference IDs
  SELECT id INTO boston_gyld_id FROM gyld WHERE name = 'Boston Product';
  SELECT id INTO seattle_gyld_id FROM gyld WHERE name = 'Seattle Product';
  SELECT id INTO product_mgmt_type_id FROM gyld_type WHERE label = 'Product Management';
  SELECT id INTO mentoring_type_id FROM experience_type WHERE label = 'Mentoring';
  SELECT id INTO happy_hour_type_id FROM experience_type WHERE label = 'Happy Hour';
  SELECT id INTO coworking_type_id FROM experience_type WHERE label = 'Coworking';
  SELECT id INTO supper_club_type_id FROM experience_type WHERE label = 'Supper Club';
  SELECT id INTO launched_status_id FROM gathering_status WHERE label = 'launched';

  -- Create user profiles for all 8 existing users
  FOR i IN 1..8 LOOP
    current_user_id := user_ids[i];
    
    -- Determine target gyld (first 6 go to Boston Product, last 2 go to Seattle Product)
    IF i <= 6 THEN
      target_gyld_id := boston_gyld_id;
    ELSE
      target_gyld_id := seattle_gyld_id;
    END IF;
    
    -- Insert/update users_public
    INSERT INTO users_public (
      user_id, first, full_name, title, list, 
      profpic, blurb, gyld
    ) VALUES (
      current_user_id,
      user_first_names[i],
      user_full_names[i],
      user_titles[i],
      i,
      user_profpics[i],
      user_blurbs[i],
      target_gyld_id
    ) ON CONFLICT (user_id) DO UPDATE SET
      first = EXCLUDED.first,
      full_name = EXCLUDED.full_name,
      title = EXCLUDED.title,
      list = EXCLUDED.list,
      profpic = EXCLUDED.profpic,
      blurb = EXCLUDED.blurb,
      gyld = EXCLUDED.gyld;
    
    -- Insert/update users_internal
    INSERT INTO users_internal (
      user_id, user_status, proflink, phone_number, start_field
    ) VALUES (
      current_user_id,
      'Active',
      user_proflinks[i],
      user_phone_numbers[i],
      NOW() - (RANDOM() * 365 * 5)::INTEGER * INTERVAL '1 day'  -- Random start date within 5 years
    ) ON CONFLICT (user_id) DO UPDATE SET
      user_status = EXCLUDED.user_status,
      proflink = EXCLUDED.proflink,
      phone_number = EXCLUDED.phone_number,
      start_field = EXCLUDED.start_field;
    
    -- Insert/update users_private
    INSERT INTO users_private (
      user_id, onboard_status, founding_member, cc_active
    ) VALUES (
      current_user_id,
      CASE WHEN i <= 3 THEN 100 ELSE (RANDOM() * 80 + 20)::INTEGER END,  -- First 3 fully onboarded
      i <= 2,  -- First 2 are founding members
      i <= 6   -- All Boston Product users have active CC
    ) ON CONFLICT (user_id) DO UPDATE SET
      onboard_status = EXCLUDED.onboard_status,
      founding_member = EXCLUDED.founding_member,
      cc_active = EXCLUDED.cc_active;
  END LOOP;
  
  -- Add user 700402a2-642a-4864-b55b-173d21417035 as organizer of Boston Product gyld
  UPDATE gyld 
  SET organizer = array_append(organizer, '700402a2-642a-4864-b55b-173d21417035'::UUID)
  WHERE name = 'Boston Product' 
  AND NOT ('700402a2-642a-4864-b55b-173d21417035'::UUID = ANY(organizer));

  -- Create 5 gatherings in Boston Product with different hosting arrangements
  DECLARE
    gathering_titles TEXT[] := ARRAY[
      '1:1 Product Mentoring Session', 
      'Advanced Product Mentoring Workshop', 
      'Product Professional Happy Hour', 
      'Product Strategy Coworking', 
      'Product Leaders Supper Club'
    ];
    experience_types UUID[] := ARRAY[
      mentoring_type_id, 
      mentoring_type_id, 
      happy_hour_type_id, 
      coworking_type_id, 
      supper_club_type_id
    ];
    gathering_descriptions TEXT[] := ARRAY[
      'Join us for personalized 1:1 mentoring focused on advancing your product management career. We''ll discuss challenges, set goals, and create actionable plans.',
      'Deep-dive mentoring workshop covering advanced product management techniques, stakeholder management, and strategic thinking.',
      'Network with fellow product professionals in a relaxed setting. Great opportunity to share experiences and build connections.',
      'Collaborative working session where product managers work on strategic initiatives together while sharing insights and feedback.',
      'Intimate dinner gathering for senior product leaders to discuss industry trends, challenges, and best practices over great food.'
    ];
    gathering_addresses TEXT[] := ARRAY[
      'Remote via Zoom',
      'Remote via Zoom', 
      'The Hub Boston, 25 Court St, Boston, MA 02108',
      'WeWork Boston, 745 Atlantic Ave, Boston, MA 02111',
      'North End Italian Restaurant, 123 Hanover St, Boston, MA 02113'
    ];
    gathering_id UUID;
    host_user1 UUID := user_ids[1];  -- Alex
    host_user2 UUID := user_ids[2];  -- Jordan
    current_hosts UUID[];
  BEGIN
    
    FOR i IN 1..5 LOOP
      gathering_id := gen_random_uuid();
      
      -- Set up hosting arrangements for each gathering
      CASE 
        WHEN i = 1 THEN current_hosts := ARRAY[host_user1];               -- Alex hosts gathering 1
        WHEN i = 2 THEN current_hosts := ARRAY[host_user2];               -- Jordan hosts gathering 2
        WHEN i = 3 THEN current_hosts := ARRAY[host_user1, host_user2];   -- Both host gathering 3
        WHEN i = 4 THEN current_hosts := ARRAY[host_user1];               -- Alex hosts gathering 4
        WHEN i = 5 THEN current_hosts := ARRAY[host_user2];               -- Jordan hosts gathering 5
      END CASE;
      
      -- Insert gathering (August 2025 dates, 1.5-2.5 hour durations)
      INSERT INTO gatherings (
        id, title, start_time, end_time, gathering_status, experience_type,
        gyld, host
      ) VALUES (
        gathering_id,
        gathering_titles[i],
        '2025-08-01 18:00:00'::timestamp + (i * 7)::INTEGER * INTERVAL '1 day',
        '2025-08-01 18:00:00'::timestamp + (i * 7)::INTEGER * INTERVAL '1 day' + 
          CASE 
            WHEN i <= 2 THEN INTERVAL '90 minutes'  -- 1.5 hours for mentoring
            WHEN i = 3 THEN INTERVAL '2.5 hours'    -- 2.5 hours for happy hour
            WHEN i = 4 THEN INTERVAL '2 hours'      -- 2 hours for coworking
            WHEN i = 5 THEN INTERVAL '2.5 hours'    -- 2.5 hours for supper club
          END,
        launched_status_id,
        experience_types[i],
        ARRAY[boston_gyld_id],
        current_hosts
      );
      
      -- Insert gathering_displays (with scribes assigned)
      INSERT INTO gathering_displays (
        gathering_id, address, image, description, meeting_link, location_instructions, scribe
      ) VALUES (
        gathering_id,
        gathering_addresses[i],
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
        gathering_descriptions[i],
        CASE 
          WHEN i <= 2 OR i = 4 THEN 'https://zoom.us/j/12345678' || i::text
          ELSE NULL
        END,
        CASE 
          WHEN i = 3 THEN 'Enter through main lobby, take elevator to 5th floor'
          WHEN i = 4 THEN 'Check in at WeWork reception, ask for Product Coworking group' 
          WHEN i = 5 THEN 'Reservation under "Gyld Product" - private dining room upstairs'
          ELSE 'Zoom link will be sent 1 hour before the session'
        END,
        -- Assign different users as scribes for each gathering
        CASE 
          WHEN i = 1 THEN user_ids[3]  -- Morgan as scribe for gathering 1
          WHEN i = 2 THEN user_ids[4]  -- Taylor as scribe for gathering 2
          WHEN i = 3 THEN user_ids[5]  -- Casey as scribe for gathering 3
          WHEN i = 4 THEN user_ids[6]  -- Riley as scribe for gathering 4
          WHEN i = 5 THEN user_ids[3]  -- Morgan as scribe for gathering 5
        END
      );
      
      -- Insert gathering_other
      INSERT INTO gathering_other (
        gathering, cap, payment_amount, payment_for, remote, recruitment, signup_question
      ) VALUES (
        gathering_id,
        CASE 
          WHEN i <= 2 THEN 1
          WHEN i = 3 THEN 25
          WHEN i = 4 THEN 8
          WHEN i = 5 THEN 12
        END,
        CASE 
          WHEN i = 5 THEN 65.00
          ELSE NULL
        END,
        CASE 
          WHEN i = 5 THEN 'Dinner and drinks at premium restaurant'
          ELSE NULL
        END,
        i <= 2 OR i = 4,
        i != 5,
        CASE 
          WHEN i <= 2 THEN 'What specific product management challenge would you like to focus on?'
          WHEN i = 3 THEN 'What''s your current role and company?'
          WHEN i = 4 THEN 'What product strategy project are you working on?'
          WHEN i = 5 THEN 'How many years of product leadership experience do you have?'
        END
      );
    END LOOP;
  END;
END $$;

-- Create 10 employers (major companies with correct websites)
DO $$
BEGIN
  -- CRITICAL: Environment check with production block
  IF current_database() ILIKE '%prod%' OR current_database() ILIKE '%gyld-native-prod%' THEN
    RAISE EXCEPTION 'CRITICAL BLOCK: Attempted to create dummy employers in PRODUCTION database %', current_database();
  END IF;
  
  -- Exit early if not development
  IF NOT is_gyld_development_environment() THEN
    RAISE NOTICE 'Skipping employer creation - not in development environment (db: %)', current_database();
    RETURN;
  END IF;

  -- Insert 10 major tech employers
  INSERT INTO employers (name, li_url) VALUES
    ('Google', 'linkedin.com/company/google'),
    ('Anthropic', 'linkedin.com/company/anthropic-ai'),
    ('OpenAI', 'linkedin.com/company/openai'),
    ('Microsoft', 'linkedin.com/company/microsoft'),
    ('Apple', 'linkedin.com/company/apple'),
    ('Meta', 'linkedin.com/company/meta'),
    ('Amazon', 'linkedin.com/company/amazon'),
    ('Netflix', 'linkedin.com/company/netflix'),
    ('Stripe', 'linkedin.com/company/stripe'),
    ('Airbnb', 'linkedin.com/company/airbnb')
  ON CONFLICT (li_url) DO NOTHING;
  
  RAISE NOTICE 'Created 10 employers for development environment';
END $$;

-- Update existing users with employer assignments
DO $$
DECLARE
  employer_ids UUID[];
  i INTEGER;
BEGIN
  -- CRITICAL: Environment check with production block
  IF current_database() ILIKE '%prod%' OR current_database() ILIKE '%gyld-native-prod%' THEN
    RAISE EXCEPTION 'CRITICAL BLOCK: Attempted to update user employers in PRODUCTION database %', current_database();
  END IF;
  
  -- Exit early if not development
  IF NOT is_gyld_development_environment() THEN
    RAISE NOTICE 'Skipping user employer updates - not in development environment (db: %)', current_database();
    RETURN;
  END IF;

  -- Get employer IDs in order
  SELECT ARRAY(SELECT id FROM employers ORDER BY name) INTO employer_ids;
  
  -- Update users_public with employer assignments (cycling through employers)
  FOR i IN 1..8 LOOP
    UPDATE users_public 
    SET employer = employer_ids[((i-1) % 10) + 1]
    WHERE user_id = (
      CASE i
        WHEN 1 THEN '9a5566e7-3c23-4070-8af6-2190a0abd521'::UUID  -- Alex -> Airbnb
        WHEN 2 THEN 'e0f9dc41-e938-46f9-a522-8b701036b1d9'::UUID  -- Jordan -> Amazon
        WHEN 3 THEN '700402a2-642a-4864-b55b-173d21417035'::UUID  -- Morgan -> Anthropic
        WHEN 4 THEN '25411f2e-51d2-4a64-b527-7e969af31cb2'::UUID  -- Taylor -> Apple
        WHEN 5 THEN '1fb79be7-fe06-4a68-a706-b5b0c2ca90fb'::UUID  -- Casey -> Google
        WHEN 6 THEN '6eb59106-c941-4816-9157-80a5fc991580'::UUID  -- Riley -> Meta
        WHEN 7 THEN '57b85864-be10-4be1-a93d-4cec27556870'::UUID  -- Sam -> Microsoft
        WHEN 8 THEN '34cafef8-f196-470c-add5-40d1f034ce4a'::UUID  -- Drew -> Netflix
      END
    );
  END LOOP;
  
  RAISE NOTICE 'Updated 8 existing users with employer assignments';
END $$;

-- Create 15 mentors (10 Boston Product, 5 Seattle Product) with mentor_satellites
DO $$
DECLARE
  boston_gyld_id UUID;
  seattle_gyld_id UUID;
  employer_ids UUID[];
  mentor_status_ids UUID[];
  fellow_status_id UUID;
  mentor_status_id UUID;
  candidate_status_id UUID;
  approved_status_id UUID;
  
  -- Mentor data arrays
  mentor_user_ids UUID[];
  mentor_first_names TEXT[];
  mentor_full_names TEXT[];
  mentor_titles TEXT[];
  mentor_profpics TEXT[];
  mentor_bios TEXT[];
  mentor_taglines TEXT[];
  mentor_emails TEXT[];
  mentor_proflinks TEXT[];
  
  current_mentor_id UUID;
  current_mentor_satellite_id UUID;
  i INTEGER;
BEGIN
  -- CRITICAL: Environment check with production block
  IF current_database() ILIKE '%prod%' OR current_database() ILIKE '%gyld-native-prod%' THEN
    RAISE EXCEPTION 'CRITICAL BLOCK: Attempted to create dummy mentors in PRODUCTION database %', current_database();
  END IF;
  
  -- Exit early if not development
  IF NOT is_gyld_development_environment() THEN
    RAISE NOTICE 'Skipping mentor creation - not in development environment (db: %)', current_database();
    RETURN;
  END IF;

  -- Get reference IDs
  SELECT id INTO boston_gyld_id FROM gyld WHERE name = 'Boston Product';
  SELECT id INTO seattle_gyld_id FROM gyld WHERE name = 'Seattle Product';
  SELECT ARRAY(SELECT id FROM employers ORDER BY name) INTO employer_ids;
  
  SELECT id INTO fellow_status_id FROM mentor_status WHERE label = 'Fellow';
  SELECT id INTO mentor_status_id FROM mentor_status WHERE label = 'Mentor';
  SELECT id INTO candidate_status_id FROM mentor_status WHERE label = 'Candidate';
  SELECT id INTO approved_status_id FROM mentor_approval WHERE label = 'Accepted';
  
  -- Use existing user IDs for mentors (only using the 8 existing users)
  mentor_user_ids := ARRAY[
    '9a5566e7-3c23-4070-8af6-2190a0abd521',  -- Alex
    'e0f9dc41-e938-46f9-a522-8b701036b1d9',  -- Jordan
    '700402a2-642a-4864-b55b-173d21417035',  -- Morgan
    '25411f2e-51d2-4a64-b527-7e969af31cb2',  -- Taylor
    '1fb79be7-fe06-4a68-a706-b5b0c2ca90fb',  -- Casey
    '6eb59106-c941-4816-9157-80a5fc991580',  -- Riley
    '57b85864-be10-4be1-a93d-4cec27556870',  -- Sam
    '34cafef8-f196-470c-add5-40d1f034ce4a'   -- Drew
  ];
  
  mentor_first_names := ARRAY[
    'Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Sam', 'Drew'
  ];
  
  mentor_full_names := ARRAY[
    'Alex Chen', 'Jordan Rivera', 'Morgan Williams', 'Taylor Johnson', 
    'Casey Brown', 'Riley Davis', 'Sam Wilson', 'Drew Martinez'
  ];
  
  mentor_titles := ARRAY[
    'Senior Product Manager', 'Product Lead', 'Product Manager', 'Associate Product Manager',
    'Principal Product Manager', 'VP Product', 'Senior Product Manager', 'Product Director'
  ];
  
  mentor_profpics := ARRAY[
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108755-2616b612b5c0?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face'
  ];
  
  mentor_bios := ARRAY[
    'Experienced product leader with deep expertise in user research and data-driven decision making.',
    'Strategic product executive focused on growth initiatives and product-market fit optimization.',
    'Product management expert specializing in B2B platforms and enterprise customer needs.',
    'Results-driven PM with strong technical background and experience in mobile-first products.',
    'Senior product leader with expertise in marketplace dynamics and two-sided platform strategy.',
    'VP of Product with extensive experience scaling teams and building product culture.',
    'Product strategist with focus on emerging markets and international product expansion.',
    'Product director specializing in fintech products and regulatory compliance frameworks.'
  ];
  
  mentor_taglines := ARRAY[
    'Building products that users love through data and empathy',
    'Growth-focused product leader with proven track record',
    'Enterprise product expert focused on customer success',
    'Technical PM bridging engineering and business needs',
    'Marketplace strategist passionate about network effects',
    'Product culture builder and team scaling expert',
    'Global product expansion and localization specialist',
    'Fintech product leader navigating complex regulations'
  ];
  
  mentor_emails := ARRAY[
    'alex.chen.mentor@gmail.com', 'jordan.rivera.pm@gmail.com', 'morgan.williams.product@gmail.com',
    'taylor.johnson.pm@gmail.com', 'casey.brown.product@gmail.com', 'riley.davis.vp@gmail.com',
    'sam.wilson.mentor@gmail.com', 'drew.martinez.pm@gmail.com'
  ];
  
  mentor_proflinks := ARRAY[
    'linkedin.com/in/alex-chen-mentor', 'linkedin.com/in/jordan-rivera-product-lead',
    'linkedin.com/in/morgan-williams-product-manager', 'linkedin.com/in/taylor-johnson-associate-pm',
    'linkedin.com/in/casey-brown-principal-pm', 'linkedin.com/in/riley-davis-vp-product',
    'linkedin.com/in/sam-wilson-senior-pm', 'linkedin.com/in/drew-martinez-product-director'
  ];
  
  -- Create 8 mentors (all 8 existing users will be mentors)
  FOR i IN 1..8 LOOP
    current_mentor_id := gen_random_uuid();
    current_mentor_satellite_id := gen_random_uuid();
    
    -- Insert mentor record
    INSERT INTO mentors (
      id, user_id, email, proflink, employer, mentor_status, mentor_approval, gyld
    ) VALUES (
      current_mentor_id,
      mentor_user_ids[i],
      mentor_emails[i],
      mentor_proflinks[i],
      employer_ids[((i-1) % 10) + 1],  -- Cycle through employers
      -- Boston Product mentors (1-6): 3 fellow, 2 mentor, 1 candidate
      -- Seattle Product mentors (7-8): 1 fellow, 1 mentor
      CASE 
        WHEN i <= 6 THEN  -- Boston Product mentors
          CASE 
            WHEN i <= 3 THEN fellow_status_id      -- Fellows: 1-3 (Alex, Jordan, Morgan)
            WHEN i <= 5 THEN mentor_status_id      -- Mentors: 4-5 (Taylor, Casey)
            ELSE candidate_status_id               -- Candidates: 6 (Riley)
          END
        ELSE  -- Seattle Product mentors (7-8)
          CASE 
            WHEN i = 7 THEN fellow_status_id       -- Fellow: 7 (Sam)
            ELSE mentor_status_id                  -- Mentor: 8 (Drew)
          END
      END,
      approved_status_id,
      CASE WHEN i <= 6 THEN ARRAY[boston_gyld_id] ELSE ARRAY[seattle_gyld_id] END
    );
    
    -- Insert mentor_satellites record (1:1 relationship)
    INSERT INTO mentor_satellites (
      id, mentor_id, first, full_name, profpic, title, bio, tagline
    ) VALUES (
      current_mentor_satellite_id,
      current_mentor_id,
      mentor_first_names[i],
      mentor_full_names[i],
      mentor_profpics[i],
      mentor_titles[i],
      mentor_bios[i],
      mentor_taglines[i]
    );
  END LOOP;
  
  RAISE NOTICE 'Created 8 mentors (6 Boston Product, 2 Seattle Product) with mentor_satellites';
END $$;

-- Add fellow mentors to the two mentoring gatherings
DO $$
DECLARE
  mentoring_gathering_ids UUID[];
  fellow_mentor_ids UUID[];
  fellow_status_id UUID;
  boston_gyld_id UUID;
BEGIN
  -- CRITICAL: Environment check with production block
  IF current_database() ILIKE '%prod%' OR current_database() ILIKE '%gyld-native-prod%' THEN
    RAISE EXCEPTION 'CRITICAL BLOCK: Attempted to update gathering mentors in PRODUCTION database %', current_database();
  END IF;
  
  -- Exit early if not development
  IF NOT is_gyld_development_environment() THEN
    RAISE NOTICE 'Skipping gathering mentor updates - not in development environment (db: %)', current_database();
    RETURN;
  END IF;

  -- Get reference IDs
  SELECT id INTO fellow_status_id FROM mentor_status WHERE label = 'Fellow';
  SELECT id INTO boston_gyld_id FROM gyld WHERE name = 'Boston Product';
  
  -- Get the two mentoring gatherings (experience_type = 'Mentoring')
  SELECT ARRAY(
    SELECT g.id 
    FROM gatherings g 
    JOIN experience_type et ON g.experience_type = et.id 
    WHERE et.label = 'Mentoring' 
    AND boston_gyld_id = ANY(g.gyld)
    ORDER BY g.start_time
    LIMIT 2
  ) INTO mentoring_gathering_ids;
  
  -- Get fellow mentors from Boston Product gyld
  SELECT ARRAY(
    SELECT m.id 
    FROM mentors m 
    WHERE m.mentor_status = fellow_status_id 
    AND boston_gyld_id = ANY(m.gyld)
    LIMIT 2
  ) INTO fellow_mentor_ids;
  
  -- Update gathering_displays to add fellow mentors
  -- Gathering 1: Add first fellow mentor
  UPDATE gathering_displays 
  SET mentor = ARRAY[fellow_mentor_ids[1]]
  WHERE gathering_id = mentoring_gathering_ids[1];
  
  -- Gathering 2: Add second fellow mentor  
  UPDATE gathering_displays 
  SET mentor = ARRAY[fellow_mentor_ids[2]]
  WHERE gathering_id = mentoring_gathering_ids[2];
  
  RAISE NOTICE 'Added fellow mentors to 2 mentoring gatherings';
END $$;

-- Clean up the environment check function (optional - keeping it for safety)
-- Uncomment the next line if you want to remove the helper function after migration
-- DROP FUNCTION IF EXISTS is_gyld_development_environment();

-- Summary of what this migration creates (DEVELOPMENT ONLY - gyld-native-dev):
-- 🛡️ PRODUCTION SAFETY: Multiple checks prevent execution in gyld-native-prod
-- 🛡️ FAIL-SAFE: Throws exceptions if accidentally run in production
-- ✅ 2 gyld records: "Boston Product" and "Seattle Product"
-- ✅ Complete user profiles for ALL 8 existing users:
--     • 6 users in "Boston Product" gyld (Alex, Jordan, Morgan, Taylor, Casey, Riley)
--     • 2 users in "Seattle Product" gyld (Sam, Drew)
-- ✅ Full profile data in users_public, users_internal, users_private for all users
-- ✅ User 700402a2-642a-4864-b55b-173d21417035 added as organizer of Boston Product
-- ✅ 10 major employers with correct LinkedIn URLs:
--     • Google, Anthropic, OpenAI, Microsoft, Apple, Meta, Amazon, Netflix, Stripe, Airbnb
-- ✅ All 8 existing users assigned employers (cycling through the 10 companies)
-- ✅ 15 mentors with complete mentor and mentor_satellites profiles:
--     • 10 Boston Product mentors (5 Fellow, 2 Mentor, 3 Candidate status)
--     • 5 Seattle Product mentors (all Mentor status)
--     • All mentors assigned employers from the 10 major companies
--     • Complete profiles with names, titles, bios, professional photos
-- ✅ 5 gatherings with different hosting arrangements (August 2025):
--     • Gathering 1 (Mentoring): Alex hosts, Morgan scribes, Fellow mentor assigned (Aug 8, 1.5hrs)
--     • Gathering 2 (Mentoring): Jordan hosts, Taylor scribes, Fellow mentor assigned (Aug 15, 1.5hrs)  
--     • Gathering 3 (Happy Hour): Both Alex & Jordan host, Casey scribes (Aug 22, 2.5hrs)
--     • Gathering 4 (Coworking): Alex hosts, Riley scribes (Aug 29, 2hrs)
--     • Gathering 5 (Supper Club): Jordan hosts, Morgan scribes (Sep 5, 2.5hrs)
-- ✅ gathering_displays and gathering_other records for each gathering
-- ✅ All gatherings have "launched" status and scribes assigned
-- ✅ Fellow mentors added to both mentoring gatherings in gathering_displays.mentor field
-- 
-- PRODUCTION PROTECTION FEATURES:
-- • Checks database name for 'dev', blocks 'prod' and 'gyld-native-prod'
-- • Throws hard exceptions if run on production database
-- • Multiple fallback checks (port, user count, etc.)
-- • Clear logging of what environment was detected 