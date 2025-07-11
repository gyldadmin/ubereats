-- Add dummy participation data for testing the attending section
-- This adds 5 users with 'yes' RSVP status to test the attending display

DO $$
DECLARE
  -- The gathering ID specified by the user
  target_gathering_id UUID := '51094ba5-caf3-4b3f-9e3c-8645a014a336';
  
  -- User IDs from existing dummy data (first 5 users)
  user_ids UUID[] := ARRAY[
    '9a5566e7-3c23-4070-8af6-2190a0abd521',  -- bru3212@yahoo.com
    'e0f9dc41-e938-46f9-a522-8b701036b1d9',  -- wtriant@yahoo.com  
    '700402a2-642a-4864-b55b-173d21417035',  -- wtriant@gmail.com
    '25411f2e-51d2-4a64-b527-7e969af31cb2',  -- bill.triant@gyld.org
    '1fb79be7-fe06-4a68-a706-b5b0c2ca90fb'   -- info@gyld.org
  ];
  
  yes_status_id UUID;
  i INTEGER;
BEGIN
  -- Get the UUID for 'yes' status
  SELECT id INTO yes_status_id FROM part_gath_status WHERE label = 'yes';
  
  -- Verify we have the status ID
  IF yes_status_id IS NULL THEN
    RAISE EXCEPTION 'Could not find part_gath_status with label "yes"';
  END IF;
  
  -- Insert 5 participation records
  FOR i IN 1..5 LOOP
    -- Insert participation record with 'yes' status (use INSERT ... ON CONFLICT DO NOTHING for safety)
    INSERT INTO participation_gatherings (
      user_id, 
      gathering_id, 
      part_gath_status
    ) VALUES (
      user_ids[i],
      target_gathering_id,
      yes_status_id
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Successfully added 5 dummy participation records for gathering %', target_gathering_id;
END $$; 