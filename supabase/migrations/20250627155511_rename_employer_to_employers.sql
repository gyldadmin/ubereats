-- Migration: Rename employer table to employers
-- Created: 2025-06-27 15:55:11
-- Description: Renames the employer table to employers for consistency with naming conventions

-- Rename the table from employer to employers
ALTER TABLE public.employer RENAME TO employers;

-- Update any indexes that reference the old table name
-- (The indexes will automatically be renamed, but we can add comments if needed)

-- Add comment to document the change
COMMENT ON TABLE public.employers IS 'Employers table (renamed from employer for consistency)'; 