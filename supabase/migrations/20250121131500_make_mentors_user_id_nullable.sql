-- Migration: Make user_id nullable in mentors table
-- Date: 2025-01-21
-- Purpose: Allow mentors to exist without being associated with user accounts

-- Remove the NOT NULL constraint from user_id in mentors table
ALTER TABLE public.mentors 
ALTER COLUMN user_id DROP NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN public.mentors.user_id IS 'References auth.users(id) - optional association with user account. NULL for mentors who are not app users.'; 