-- Update experience_type records with image URLs from Supabase storage

-- Update Coaching
UPDATE experience_type SET 
    image_square = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/coaching-square.jpg',
    image_horizontal = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/coaching-horizontal.jpg'
WHERE label = 'Coaching';

-- Update Course
UPDATE experience_type SET 
    image_square = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/course-square.jpg',
    image_horizontal = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/course-horizontal.jpg'
WHERE label = 'Course';

-- Update Coworking
UPDATE experience_type SET 
    image_square = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/coworking-square.jpg',
    image_horizontal = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/coworking-horizontal.jpg'
WHERE label = 'Coworking';

-- Update Happy Hour
UPDATE experience_type SET 
    image_square = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/happy-hour-square.jpg',
    image_horizontal = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/happy-hour-horizontal.jpg'
WHERE label = 'Happy Hour';

-- Update Lottery
UPDATE experience_type SET 
    image_square = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/lottery-square.jpg',
    image_horizontal = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/lottery-horizontal.jpg'
WHERE label = 'Lottery';

-- Update Lunch
UPDATE experience_type SET 
    image_square = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/lunch-square.jpg',
    image_horizontal = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/lunch-horizontal.jpg'
WHERE label = 'Lunch';

-- Update Mentoring
UPDATE experience_type SET 
    image_square = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/mentoring-square.jpg',
    image_horizontal = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/mentoring-horizontal.jpg'
WHERE label = 'Mentoring';

-- Update Outing
UPDATE experience_type SET 
    image_square = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/outing-square.jpg',
    image_horizontal = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/outing-horizontal.jpg'
WHERE label = 'Outing';

-- Update Podcast Club
UPDATE experience_type SET 
    image_square = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/podcast-club-square.jpg',
    image_horizontal = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/podcast-club-horizontal.jpg'
WHERE label = 'Podcast Club';

-- Update Pro Bono
UPDATE experience_type SET 
    image_square = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/pro-bono-square.jpg',
    image_horizontal = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/pro-bono-horizontal.jpg'
WHERE label = 'Pro Bono';

-- Update social
UPDATE experience_type SET 
    image_square = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/social-square.jpg',
    image_horizontal = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/social-horizontal.jpg'
WHERE label = 'social';

-- Update Supper Club
UPDATE experience_type SET 
    image_square = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/supper-club-square.jpg',
    image_horizontal = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/supper-club-horizontal.jpg'
WHERE label = 'Supper Club';

-- Update Team
UPDATE experience_type SET 
    image_square = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/team-square.jpg',
    image_horizontal = 'https://bciotailhfupsmujjiag.supabase.co/storage/v1/object/public/experience-images/team-horizontal.jpg'
WHERE label = 'Team'; 