-- Migration: Add user_status column to users_internal (prerequisite)
-- Created: 2025-06-27 13:56:29
-- Description: Adds user_status TEXT column to users_internal table as prerequisite for other migrations

-- Add user_status column to users_internal table
ALTER TABLE public.users_internal 
ADD COLUMN user_status TEXT; 