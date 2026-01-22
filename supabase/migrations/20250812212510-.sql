-- Security fix: Restrict access to subscribers table to owner-only
-- 1) Drop over-permissive SELECT policy allowing any authenticated user to read all rows
DROP POLICY IF EXISTS "Authenticated users only" ON public.subscribers;

-- 2) Ensure least-privilege RLS policies exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'select_own_subscription'
  ) THEN
    CREATE POLICY "select_own_subscription" ON public.subscribers
    FOR SELECT USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'update_own_subscription'
  ) THEN
    CREATE POLICY "update_own_subscription" ON public.subscribers
    FOR UPDATE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'insert_subscription'
  ) THEN
    CREATE POLICY "insert_subscription" ON public.subscribers
    FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END$$;