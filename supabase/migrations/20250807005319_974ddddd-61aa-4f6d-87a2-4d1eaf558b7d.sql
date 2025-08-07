-- Fix critical RLS security issues

-- 1. Add proper RLS policies to user_login_events table
CREATE POLICY "Users can view their own login events" 
ON public.user_login_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own login events" 
ON public.user_login_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all login events" 
ON public.user_login_events 
FOR SELECT 
USING (is_verified_admin());

-- 2. Tighten overly permissive policies - Replace "true" policies with proper conditions

-- Update voice_rate_limits policy to be more restrictive
DROP POLICY IF EXISTS "System can manage rate limits" ON public.voice_rate_limits;
CREATE POLICY "System can manage rate limits" 
ON public.voice_rate_limits 
FOR ALL 
USING (auth.role() = 'service_role'::text OR auth.uid() = user_id);

-- Update security_logs policy to be more restrictive  
DROP POLICY IF EXISTS "Service role has full access" ON public.security_logs;
CREATE POLICY "Service role has full access" 
ON public.security_logs 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Update security_events policy
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;
CREATE POLICY "System can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role'::text OR auth.uid() = user_id);

-- 3. Add enhanced role change logging
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin activity log
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only verified admins can view admin activity logs
CREATE POLICY "Verified admins can view admin activity" 
ON public.admin_activity_log 
FOR SELECT 
USING (is_verified_admin());

-- System can insert admin activity logs
CREATE POLICY "System can insert admin activity" 
ON public.admin_activity_log 
FOR INSERT 
WITH CHECK (true);

-- 4. Create function to log admin activities
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_action_type TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_activity_log (
    admin_user_id,
    action_type,
    target_user_id,
    details
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_target_user_id,
    p_details
  );
END;
$$;

-- 5. Add trigger to log role changes
CREATE OR REPLACE FUNCTION public.enhanced_log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_admin_activity(
      'role_granted',
      NEW.user_id,
      jsonb_build_object(
        'role', NEW.role,
        'assigned_by', NEW.assigned_by
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_admin_activity(
      'role_modified',
      NEW.user_id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'assigned_by', NEW.assigned_by
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_admin_activity(
      'role_revoked',
      OLD.user_id,
      jsonb_build_object(
        'role', OLD.role,
        'assigned_by', OLD.assigned_by
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop existing trigger and create new enhanced one
DROP TRIGGER IF EXISTS log_role_changes ON public.user_roles;
CREATE TRIGGER enhanced_log_role_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_log_role_changes();