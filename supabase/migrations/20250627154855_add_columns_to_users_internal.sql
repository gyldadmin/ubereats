-- Migration: Add new columns to users_internal table
-- Created: 2025-06-27 15:48:55
-- Description: Adds activity_type, proflink, knowledge_domain, neighborhood, start_field, role_interest, and phone_number columns to users_internal table

-- Add new columns to users_internal table
ALTER TABLE public.users_internal 
ADD COLUMN IF NOT EXISTS activity_type UUID[],
ADD COLUMN IF NOT EXISTS proflink TEXT,
ADD COLUMN IF NOT EXISTS knowledge_domain UUID[],
ADD COLUMN IF NOT EXISTS neighborhood UUID REFERENCES public.neighborhoods(id),
ADD COLUMN IF NOT EXISTS start_field TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS role_interest UUID[],
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create indexes for array columns using GIN indexes for efficient array queries
CREATE INDEX IF NOT EXISTS idx_users_internal_activity_type ON public.users_internal USING GIN(activity_type);
CREATE INDEX IF NOT EXISTS idx_users_internal_knowledge_domain ON public.users_internal USING GIN(knowledge_domain);
CREATE INDEX IF NOT EXISTS idx_users_internal_role_interest ON public.users_internal USING GIN(role_interest);

-- Create indexes for foreign key and frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_internal_neighborhood ON public.users_internal(neighborhood);
CREATE INDEX IF NOT EXISTS idx_users_internal_start_field ON public.users_internal(start_field);

-- Create index for proflink for profile searches
CREATE INDEX IF NOT EXISTS idx_users_internal_proflink ON public.users_internal(proflink);

-- Add comments to document the new columns
COMMENT ON COLUMN public.users_internal.activity_type IS 'Array of activity type IDs - activity types for this user';
COMMENT ON COLUMN public.users_internal.proflink IS 'LinkedIn URL for this user without https://www part';
COMMENT ON COLUMN public.users_internal.knowledge_domain IS 'Array of knowledge domain IDs - knowledge domains for this user';
COMMENT ON COLUMN public.users_internal.neighborhood IS 'Reference to neighborhoods table - user''s neighborhood';
COMMENT ON COLUMN public.users_internal.start_field IS 'Start date in field - when user started in their field';
COMMENT ON COLUMN public.users_internal.role_interest IS 'Array of role type IDs - shows role interests for this user';
COMMENT ON COLUMN public.users_internal.phone_number IS 'User''s phone number'; 