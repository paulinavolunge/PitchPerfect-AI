-- =============================================================================
-- Migration: Enable RLS and harden policies across all public tables
-- Date: 2026-03-22
-- Description:
--   1. Fix sales_scripts: SELECT for authenticated, write ops for service_role only
--   2. Ensure service_role full access on all public tables
--   3. Fill policy gaps on tables missing user-scoped or admin policies
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. sales_scripts — shared resource: read by authenticated, write by service_role
-- =============================================================================

-- Drop existing owner-based policies
DROP POLICY IF EXISTS "sales_scripts_select_owner_admin" ON public.sales_scripts;
DROP POLICY IF EXISTS "sales_scripts_insert_secure" ON public.sales_scripts;
DROP POLICY IF EXISTS "sales_scripts_update_secure" ON public.sales_scripts;
DROP POLICY IF EXISTS "sales_scripts_delete_secure" ON public.sales_scripts;

-- RLS is already enabled, but ensure it stays on
ALTER TABLE public.sales_scripts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all scripts
CREATE POLICY "sales_scripts_select_authenticated"
  ON public.sales_scripts
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service_role can insert
CREATE POLICY "sales_scripts_insert_service_role"
  ON public.sales_scripts
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- Only service_role can update
CREATE POLICY "sales_scripts_update_service_role"
  ON public.sales_scripts
  FOR UPDATE
  TO public
  USING (auth.role() = 'service_role');

-- Only service_role can delete
CREATE POLICY "sales_scripts_delete_service_role"
  ON public.sales_scripts
  FOR DELETE
  TO public
  USING (auth.role() = 'service_role');

-- =============================================================================
-- 2. Add service_role full access policies where missing
-- =============================================================================

-- admin_activity_log
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_admin_activity_log" ON public.admin_activity_log;
CREATE POLICY "service_role_admin_activity_log"
  ON public.admin_activity_log
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- login_events
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_login_events" ON public.login_events;
CREATE POLICY "service_role_login_events"
  ON public.login_events
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- pitch_recordings
ALTER TABLE public.pitch_recordings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_pitch_recordings" ON public.pitch_recordings;
CREATE POLICY "service_role_pitch_recordings"
  ON public.pitch_recordings
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- practice_sessions
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_practice_sessions" ON public.practice_sessions;
CREATE POLICY "service_role_practice_sessions"
  ON public.practice_sessions
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- role_change_log
ALTER TABLE public.role_change_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_role_change_log" ON public.role_change_log;
CREATE POLICY "service_role_role_change_log"
  ON public.role_change_log
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- security_audit_summary
ALTER TABLE public.security_audit_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_security_audit_summary" ON public.security_audit_summary;
CREATE POLICY "service_role_security_audit_summary"
  ON public.security_audit_summary
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_security_events" ON public.security_events;
CREATE POLICY "service_role_security_events"
  ON public.security_events
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- subscribers
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_subscribers" ON public.subscribers;
CREATE POLICY "service_role_subscribers"
  ON public.subscribers
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- usage_log
ALTER TABLE public.usage_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_usage_log" ON public.usage_log;
CREATE POLICY "service_role_usage_log"
  ON public.usage_log
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- user_login_events
ALTER TABLE public.user_login_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_user_login_events" ON public.user_login_events;
CREATE POLICY "service_role_user_login_events"
  ON public.user_login_events
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- user_performance
ALTER TABLE public.user_performance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_user_performance" ON public.user_performance;
CREATE POLICY "service_role_user_performance"
  ON public.user_performance
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_user_profiles" ON public.user_profiles;
CREATE POLICY "service_role_user_profiles"
  ON public.user_profiles
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =============================================================================
-- 3. Fill policy gaps — tables missing user INSERT for own rows
-- =============================================================================

-- user_profiles: allow users to insert their own profile (needed for signup flow)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- user_profiles: allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- subscribers: allow users to insert their own subscription record
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscribers;
CREATE POLICY "Users can insert own subscription"
  ON public.subscribers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- subscribers: allow users to update their own subscription
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscribers;
CREATE POLICY "Users can update own subscription"
  ON public.subscribers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

COMMIT;

-- =============================================================================
-- NOTE: Localhost redirect URLs must be removed manually via the Supabase
-- Dashboard: Authentication → URL Configuration → Redirect URLs.
-- Remove any http://localhost:* entries from the allowed redirect list.
-- =============================================================================
