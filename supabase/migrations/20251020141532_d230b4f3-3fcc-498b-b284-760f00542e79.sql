-- Fix security_logs RLS policies - remove blanket authenticated access
-- and add explicit least-privilege policies

-- 1) Ensure safe admin check function exists (avoids recursive reads)
CREATE OR REPLACE FUNCTION public.is_verified_admin() 
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 2) Remove overly permissive policy that allows ANY authenticated user to read ALL logs
DROP POLICY IF EXISTS "Authenticated users only" ON public.security_logs;

-- 3) Drop existing policies to recreate with consistent naming
DROP POLICY IF EXISTS "users_view_own_security_logs" ON public.security_logs;
DROP POLICY IF EXISTS "users_insert_own_security_logs" ON public.security_logs;

-- 4) Enable RLS (should already be enabled, but ensure it)
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- 5) Create explicit least-privilege policies

-- Users can read only their own security logs
CREATE POLICY "users_read_own_security_logs"
ON public.security_logs FOR SELECT
USING (user_id = auth.uid());

-- Users can insert only their own security logs
CREATE POLICY "users_insert_own_security_logs"
ON public.security_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can read all security logs for auditing
CREATE POLICY "admins_read_all_security_logs"
ON public.security_logs FOR SELECT
USING (public.is_verified_admin());