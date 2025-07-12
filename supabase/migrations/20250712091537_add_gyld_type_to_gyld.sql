-- Migration: Add gyld_type column to gyld table
-- This column will store references to gyld_type records for each gyld
-- Using UUID array to allow multiple gyld types per gyld

-- Add the gyld_type column to the gyld table
ALTER TABLE public.gyld 
ADD COLUMN IF NOT EXISTS gyld_type UUID[] DEFAULT '{}';

-- Add foreign key constraint comment (arrays can't have FK constraints, so we'll handle this in application logic)
COMMENT ON COLUMN public.gyld.gyld_type IS 'Array of gyld_type IDs that this gyld is associated with';

-- Add GIN index for efficient array operations and queries
CREATE INDEX IF NOT EXISTS idx_gyld_gyld_type_gin ON public.gyld USING GIN(gyld_type);

-- Add standard B-tree index for when querying specific gyld_type values
CREATE INDEX IF NOT EXISTS idx_gyld_gyld_type_btree ON public.gyld(gyld_type);

-- Update the updated_at timestamp for any existing records (optional)
-- This ensures the updated_at field reflects when the schema was modified
UPDATE public.gyld SET updated_at = NOW() WHERE gyld_type IS NULL; 