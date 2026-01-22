-- Secure subscribers table: owner-only access + admin read
-- 1) Ensure RLS is enabled
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- 2) Remove any over-permissive policy names we may have used previously
DROP POLICY IF EXISTS "Authenticated users only" ON public.subscribers;

-- 3) Ensure least-privilege owner policies exist (idempotent)
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

-- 4) Add explicit admin read policy (idempotent) to allow verified admins to view all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'admins_view_all_subscribers'
  ) THEN
    CREATE POLICY "admins_view_all_subscribers" ON public.subscribers
    FOR SELECT USING (is_verified_admin());
  END IF;
END$$;