-- Migration: Add new columns to users_private table
-- Created: 2025-06-27 15:49:49
-- Description: Adds push_enabled, onboard_status, customer_ID, monthly_price, cc_active, and founding_member columns to users_private table

-- Add new columns to users_private table
ALTER TABLE public.users_private 
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboard_status INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_ID TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS monthly_price NUMERIC,
ADD COLUMN IF NOT EXISTS cc_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS founding_member BOOLEAN DEFAULT false;

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_private_push_enabled ON public.users_private(push_enabled);
CREATE INDEX IF NOT EXISTS idx_users_private_onboard_status ON public.users_private(onboard_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_private_customer_id ON public.users_private(customer_ID);
CREATE INDEX IF NOT EXISTS idx_users_private_cc_active ON public.users_private(cc_active);
CREATE INDEX IF NOT EXISTS idx_users_private_founding_member ON public.users_private(founding_member);

-- Create index for monthly_price for pricing queries
CREATE INDEX IF NOT EXISTS idx_users_private_monthly_price ON public.users_private(monthly_price);

-- Add comments to document the new columns
COMMENT ON COLUMN public.users_private.push_enabled IS 'Whether push notifications are enabled on phone';
COMMENT ON COLUMN public.users_private.onboard_status IS 'Where user is in onboarding process (0 = not started)';
COMMENT ON COLUMN public.users_private.customer_ID IS 'Stripe customer ID for billing';
COMMENT ON COLUMN public.users_private.monthly_price IS 'Monthly price for user subscription';
COMMENT ON COLUMN public.users_private.cc_active IS 'Whether active credit card is on file';
COMMENT ON COLUMN public.users_private.founding_member IS 'Whether user is a founding gyld member'; 