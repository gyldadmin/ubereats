-- Add mentor approval columns to mentors table
-- This migration adds approved_at and approval_expires_at fields for mentor status tracking

-- Add the new columns
ALTER TABLE mentors 
ADD COLUMN approved_at TIMESTAMPTZ,
ADD COLUMN approval_expires_at TIMESTAMPTZ;

-- Create indexes for approval status queries
CREATE INDEX idx_mentors_approved_at ON mentors(approved_at);
CREATE INDEX idx_mentors_approval_expires_at ON mentors(approval_expires_at);

-- Create composite index for approval status checks
CREATE INDEX idx_mentors_approval_status ON mentors(approved_at, approval_expires_at) 
WHERE approved_at IS NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN mentors.approved_at IS 'Timestamp when mentor was approved by admin. NULL means not approved yet.';
COMMENT ON COLUMN mentors.approval_expires_at IS 'Timestamp when mentor approval expires. NULL means approval does not expire.';

-- Verification: Check that columns were added successfully
-- To verify, you can run: SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'mentors' AND column_name IN ('approved_at', 'approval_expires_at'); 