
DROP POLICY IF EXISTS "System can insert admin activity" ON public.admin_activity_log;
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;
DROP POLICY IF EXISTS "Allow security function to insert logs" ON public.security_logs;
