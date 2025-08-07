-- Allow client-side inserts into workflow_type by relaxing RLS
-- This keeps existing RLS but adds a policy permitting INSERTs from
-- both authenticated and anon roles.

-- Ensure RLS is enabled (it already should be, but this is idempotent)
ALTER TABLE workflow_type ENABLE ROW LEVEL SECURITY;

-- Drop any existing policy with same name to avoid conflicts
DROP POLICY IF EXISTS "allow insert workflow_type" ON workflow_type;

-- Grant insert to both authenticated and anon users
CREATE POLICY "allow insert workflow_type"
ON workflow_type
FOR INSERT
TO authenticated, anon
WITH CHECK (true);
