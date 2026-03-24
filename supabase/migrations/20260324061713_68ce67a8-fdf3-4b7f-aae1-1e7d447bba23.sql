-- ============================================================
-- FIX 1: Remove policy that exposes private_notes to all authenticated users
-- ============================================================
DROP POLICY IF EXISTS "Authenticated read public scripts no private_notes" ON public.sales_scripts;

-- ============================================================
-- FIX 2: Privilege escalation via user_profiles self-update
-- ============================================================
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.user_profiles;

CREATE POLICY "Users can update own non-sensitive profile fields" ON public.user_profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.protect_billing_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF auth.role() != 'service_role' AND NOT public.is_verified_admin() THEN
    NEW.credits_remaining := OLD.credits_remaining;
    NEW.is_premium := OLD.is_premium;
    NEW.subscription_plan := OLD.subscription_plan;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_billing_fields_trigger ON public.user_profiles;
CREATE TRIGGER protect_billing_fields_trigger
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_billing_fields();

-- ============================================================
-- FIX 3: Tighten all {public} role policies to {authenticated}
-- ============================================================

-- admin_activity_log
DROP POLICY IF EXISTS "System can insert admin activity" ON public.admin_activity_log;
CREATE POLICY "System can insert admin activity" ON public.admin_activity_log
FOR INSERT TO authenticated
WITH CHECK ((auth.role() = 'service_role'::text) OR (admin_user_id = auth.uid()));

-- auth_rate_limits
DROP POLICY IF EXISTS "users_view_own_rate_limits" ON public.auth_rate_limits;
CREATE POLICY "users_view_own_rate_limits" ON public.auth_rate_limits
FOR SELECT TO authenticated
USING ((auth.uid())::text = (SELECT (u.id)::text FROM auth.users u WHERE (u.email)::text = auth_rate_limits.email));

-- data_access_logs
DROP POLICY IF EXISTS "admins_read_data_access_logs" ON public.data_access_logs;
CREATE POLICY "admins_read_data_access_logs" ON public.data_access_logs
FOR SELECT TO authenticated
USING (is_admin());

-- login_events
DROP POLICY IF EXISTS "users_insert_own_login_events" ON public.login_events;
CREATE POLICY "users_insert_own_login_events" ON public.login_events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- pitch_recordings
DROP POLICY IF EXISTS "Deny anonymous access to pitch recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "pitch_recordings_delete_secure" ON public.pitch_recordings;
DROP POLICY IF EXISTS "pitch_recordings_insert_secure" ON public.pitch_recordings;
DROP POLICY IF EXISTS "pitch_recordings_select_secure" ON public.pitch_recordings;
DROP POLICY IF EXISTS "pitch_recordings_update_secure" ON public.pitch_recordings;

CREATE POLICY "pitch_recordings_select_secure" ON public.pitch_recordings
FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR (is_public = true) OR is_verified_admin());

CREATE POLICY "pitch_recordings_insert_secure" ON public.pitch_recordings
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "pitch_recordings_update_secure" ON public.pitch_recordings
FOR UPDATE TO authenticated
USING ((user_id = auth.uid()) OR is_verified_admin());

CREATE POLICY "pitch_recordings_delete_secure" ON public.pitch_recordings
FOR DELETE TO authenticated
USING ((user_id = auth.uid()) OR is_verified_admin());

-- practice_sessions
DROP POLICY IF EXISTS "Authenticated users only" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can insert their own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can update their own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can view their own practice sessions" ON public.practice_sessions;

CREATE POLICY "Users can view their own practice sessions" ON public.practice_sessions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice sessions" ON public.practice_sessions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice sessions" ON public.practice_sessions
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- role_change_log
DROP POLICY IF EXISTS "admins_view_role_changes" ON public.role_change_log;
CREATE POLICY "admins_view_role_changes" ON public.role_change_log
FOR SELECT TO authenticated
USING (is_verified_admin());

-- sales_scripts
DROP POLICY IF EXISTS "Users can read own scripts" ON public.sales_scripts;
CREATE POLICY "Users can read own scripts" ON public.sales_scripts
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- security_audit_summary
DROP POLICY IF EXISTS "admin_only_audit_summary" ON public.security_audit_summary;
CREATE POLICY "admin_only_audit_summary" ON public.security_audit_summary
FOR ALL TO authenticated
USING (is_verified_admin());

-- security_events
DROP POLICY IF EXISTS "Only admins can view security events" ON public.security_events;
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;
CREATE POLICY "Only admins can view security events" ON public.security_events
FOR SELECT TO authenticated
USING (is_verified_admin());
CREATE POLICY "System can insert security events" ON public.security_events
FOR INSERT TO authenticated
WITH CHECK ((auth.role() = 'service_role'::text) OR (auth.uid() = user_id));

-- security_logs
DROP POLICY IF EXISTS "Allow security function to insert logs" ON public.security_logs;
DROP POLICY IF EXISTS "admins_read_all_security_logs" ON public.security_logs;
DROP POLICY IF EXISTS "users_read_own_security_logs" ON public.security_logs;
CREATE POLICY "Allow security function to insert logs" ON public.security_logs
FOR INSERT TO authenticated
WITH CHECK ((auth.role() = 'service_role'::text) OR (user_id = auth.uid()));
CREATE POLICY "admins_read_all_security_logs" ON public.security_logs
FOR SELECT TO authenticated
USING (is_verified_admin());
CREATE POLICY "users_read_own_security_logs" ON public.security_logs
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- usage_log
DROP POLICY IF EXISTS "System can insert usage logs" ON public.usage_log;
DROP POLICY IF EXISTS "Users can view own usage logs" ON public.usage_log;
CREATE POLICY "System can insert usage logs" ON public.usage_log
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own usage logs" ON public.usage_log
FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR is_verified_admin());

-- user_login_events
DROP POLICY IF EXISTS "Admins can view all login events" ON public.user_login_events;
DROP POLICY IF EXISTS "Users can insert their own login events" ON public.user_login_events;
DROP POLICY IF EXISTS "Users can view their own login events" ON public.user_login_events;
CREATE POLICY "Admins can view all login events" ON public.user_login_events
FOR SELECT TO authenticated
USING (is_verified_admin());
CREATE POLICY "Users can insert their own login events" ON public.user_login_events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own login events" ON public.user_login_events
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- user_performance
DROP POLICY IF EXISTS "user_performance_delete_secure" ON public.user_performance;
DROP POLICY IF EXISTS "user_performance_insert_secure" ON public.user_performance;
DROP POLICY IF EXISTS "user_performance_select_secure" ON public.user_performance;
DROP POLICY IF EXISTS "user_performance_update_secure" ON public.user_performance;
CREATE POLICY "user_performance_select_secure" ON public.user_performance
FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR is_verified_admin());
CREATE POLICY "user_performance_insert_secure" ON public.user_performance
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_performance_update_secure" ON public.user_performance
FOR UPDATE TO authenticated
USING ((user_id = auth.uid()) OR is_verified_admin());
CREATE POLICY "user_performance_delete_secure" ON public.user_performance
FOR DELETE TO authenticated
USING ((user_id = auth.uid()) OR is_verified_admin());

-- user_profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
FOR SELECT TO authenticated
USING (is_verified_admin());
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
FOR UPDATE TO authenticated
USING (is_verified_admin());
CREATE POLICY "Users can view own profile" ON public.user_profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- user_roles
DROP POLICY IF EXISTS "admins_manage_roles" ON public.user_roles;
DROP POLICY IF EXISTS "prevent_self_privilege_escalation" ON public.user_roles;
CREATE POLICY "admins_manage_roles" ON public.user_roles
FOR ALL TO authenticated
USING (is_verified_admin())
WITH CHECK (is_verified_admin());
CREATE POLICY "prevent_self_privilege_escalation" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK ((auth.uid() <> user_id) AND (EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
)));

-- voice_rate_limits
DROP POLICY IF EXISTS "Users can read own rate limits v2" ON public.voice_rate_limits;
DROP POLICY IF EXISTS "Users can view own rate limits" ON public.voice_rate_limits;
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.voice_rate_limits;
CREATE POLICY "Users can view own rate limits" ON public.voice_rate_limits
FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR is_verified_admin());
CREATE POLICY "Service role manages rate limits" ON public.voice_rate_limits
FOR ALL TO authenticated
USING (auth.role() = 'service_role'::text);