-- Allow authenticated users to insert their own planned_workflows rows
-- Guard: requires column planned_workflows.user_id referencing auth.users(id)

DO $$ BEGIN
  -- add user_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'planned_workflows'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.planned_workflows
      ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.planned_workflows ENABLE ROW LEVEL SECURITY;

-- Insert policy: user may insert rows for themselves
CREATE POLICY insert_planned_workflows_by_owner
  ON public.planned_workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Optional: select only own rows by default
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'planned_workflows'
      AND policyname = 'select_planned_workflows_by_owner'
  ) THEN
    CREATE POLICY select_planned_workflows_by_owner
      ON public.planned_workflows
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;


