-- Secure subscribers table RLS: remove overly broad policies and ensure least privilege

-- Ensure RLS is enabled
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Remove any broad authenticated SELECT policies if they exist
DROP POLICY IF EXISTS "Authenticated users only" ON public.subscribers;
DROP POLICY IF EXISTS authenticated_select ON public.subscribers;
DROP POLICY IF EXISTS allow_all_authenticated ON public.subscribers;

-- Ensure per-user SELECT policy exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='subscribers' AND policyname='Users can view own subscription data'
  ) THEN
    CREATE POLICY "Users can view own subscription data" 
    ON public.subscribers
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure per-user UPDATE policy exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='subscribers' AND policyname='Users can update own subscription data'
  ) THEN
    CREATE POLICY "Users can update own subscription data" 
    ON public.subscribers
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure per-user INSERT policy exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='subscribers' AND policyname='Users can insert own subscription data'
  ) THEN
    CREATE POLICY "Users can insert own subscription data" 
    ON public.subscribers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure admin can view all data
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='subscribers' AND policyname='Admins can view all subscription data'
  ) THEN
    CREATE POLICY "Admins can view all subscription data"
    ON public.subscribers
    FOR SELECT
    USING (public.is_verified_admin());
  END IF;
END $$;

-- Ensure service_role write access (no SELECT) for edge functions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='subscribers' AND policyname='service_role_insert_subscribers'
  ) THEN
    CREATE POLICY "service_role_insert_subscribers"
    ON public.subscribers
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='subscribers' AND policyname='service_role_update_subscribers'
  ) THEN
    CREATE POLICY "service_role_update_subscribers"
    ON public.subscribers
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='subscribers' AND policyname='service_role_delete_subscribers'
  ) THEN
    CREATE POLICY "service_role_delete_subscribers"
    ON public.subscribers
    FOR DELETE
    USING (auth.role() = 'service_role');
  END IF;
END $$;
