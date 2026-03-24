-- Fix remaining {public} role policies that should be {authenticated}
-- Note: service_role policies must stay as {public} since service_role isn't in {authenticated}

-- admin_activity_log: admins_only_view_activity already targets authenticated, 
-- but service_role_admin_activity_log needs to stay {public}. No change needed.

-- auth_rate_limits: fix duplicate service_role policies
DROP POLICY IF EXISTS "service_role_auth_rate_limits" ON public.auth_rate_limits;
DROP POLICY IF EXISTS "service_role_manages_auth_rate_limits" ON public.auth_rate_limits;
CREATE POLICY "service_role_auth_rate_limits" ON public.auth_rate_limits
FOR ALL TO service_role
USING (true);

-- data_access_logs
DROP POLICY IF EXISTS "Allow admins to read access logs" ON public.data_access_logs;
DROP POLICY IF EXISTS "service_role_only_data_access_logs" ON public.data_access_logs;
CREATE POLICY "service_role_only_data_access_logs" ON public.data_access_logs
FOR ALL TO service_role
USING (true);

-- admin_activity_log
DROP POLICY IF EXISTS "service_role_admin_activity_log" ON public.admin_activity_log;
CREATE POLICY "service_role_admin_activity_log" ON public.admin_activity_log
FOR ALL TO service_role
USING (true);

-- login_events
DROP POLICY IF EXISTS "Allow admins to view all login history" ON public.login_events;
DROP POLICY IF EXISTS "Allow users to view their own login history" ON public.login_events;
DROP POLICY IF EXISTS "service_role_login_events" ON public.login_events;
CREATE POLICY "Allow admins to view all login history" ON public.login_events
FOR SELECT TO authenticated
USING (is_verified_admin());
CREATE POLICY "Allow users to view their own login history" ON public.login_events
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "service_role_login_events" ON public.login_events
FOR ALL TO service_role
USING (true);

-- pitch_recordings
DROP POLICY IF EXISTS "service_role_pitch_recordings" ON public.pitch_recordings;
CREATE POLICY "service_role_pitch_recordings" ON public.pitch_recordings
FOR ALL TO service_role
USING (true);

-- practice_sessions
DROP POLICY IF EXISTS "service_role_practice_sessions" ON public.practice_sessions;
CREATE POLICY "service_role_practice_sessions" ON public.practice_sessions
FOR ALL TO service_role
USING (true);

-- role_change_log
DROP POLICY IF EXISTS "service_role_role_change_log" ON public.role_change_log;
CREATE POLICY "service_role_role_change_log" ON public.role_change_log
FOR ALL TO service_role
USING (true);

-- sales_scripts
DROP POLICY IF EXISTS "Service role full access to sales_scripts" ON public.sales_scripts;
DROP POLICY IF EXISTS "sales_scripts_delete_service_role" ON public.sales_scripts;
DROP POLICY IF EXISTS "sales_scripts_insert_service_role" ON public.sales_scripts;
DROP POLICY IF EXISTS "sales_scripts_update_service_role" ON public.sales_scripts;
CREATE POLICY "service_role_sales_scripts" ON public.sales_scripts
FOR ALL TO service_role
USING (true);

-- security_audit_summary
DROP POLICY IF EXISTS "service_role_security_audit_summary" ON public.security_audit_summary;
CREATE POLICY "service_role_security_audit_summary" ON public.security_audit_summary
FOR ALL TO service_role
USING (true);

-- security_events
DROP POLICY IF EXISTS "service_role_security_events" ON public.security_events;
CREATE POLICY "service_role_security_events" ON public.security_events
FOR ALL TO service_role
USING (true);

-- security_logs
DROP POLICY IF EXISTS "Service role has full access" ON public.security_logs;
CREATE POLICY "Service role has full access" ON public.security_logs
FOR ALL TO service_role
USING (true);

-- subscribers
DROP POLICY IF EXISTS "Admins can view all subscription data" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view own subscription data" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "service_role_subscribers" ON public.subscribers;
CREATE POLICY "Users can view own subscription data" ON public.subscribers
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscription data" ON public.subscribers
FOR SELECT TO authenticated
USING (is_verified_admin());
CREATE POLICY "Users can insert own subscription" ON public.subscribers
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON public.subscribers
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "service_role_subscribers" ON public.subscribers
FOR ALL TO service_role
USING (true);

-- usage_log
DROP POLICY IF EXISTS "service_role_usage_log" ON public.usage_log;
CREATE POLICY "service_role_usage_log" ON public.usage_log
FOR ALL TO service_role
USING (true);

-- user_login_events
DROP POLICY IF EXISTS "service_role_user_login_events" ON public.user_login_events;
CREATE POLICY "service_role_user_login_events" ON public.user_login_events
FOR ALL TO service_role
USING (true);

-- user_performance
DROP POLICY IF EXISTS "service_role_user_performance" ON public.user_performance;
CREATE POLICY "service_role_user_performance" ON public.user_performance
FOR ALL TO service_role
USING (true);

-- user_profiles
DROP POLICY IF EXISTS "service_role_user_profiles" ON public.user_profiles;
CREATE POLICY "service_role_user_profiles" ON public.user_profiles
FOR ALL TO service_role
USING (true);

-- user_roles
DROP POLICY IF EXISTS "service_role_manages_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_can_read_own_roles_simple" ON public.user_roles;
CREATE POLICY "service_role_manages_roles" ON public.user_roles
FOR ALL TO service_role
USING (true);
CREATE POLICY "users_can_read_own_roles_simple" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- voice_rate_limits: fix Service role policy
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.voice_rate_limits;
CREATE POLICY "Service role manages rate limits" ON public.voice_rate_limits
FOR ALL TO service_role
USING (true);