-- Set default value for gathering_other.remote field to false
-- This migration adds a default value to the remote boolean field

-- Add default false to the remote column
ALTER TABLE public.gathering_other 
ALTER COLUMN remote SET DEFAULT false;

-- Add comment documenting the change
COMMENT ON COLUMN public.gathering_other.remote IS 'Whether this gathering is conducted remotely (defaults to false)'; 