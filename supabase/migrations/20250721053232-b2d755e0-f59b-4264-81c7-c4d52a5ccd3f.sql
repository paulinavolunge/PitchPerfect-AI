-- Critical Security Fixes Migration
-- Fix remaining database function search paths and security issues

-- Fix all remaining functions to have proper search_path settings
CREATE OR REPLACE FUNCTION public.check_privilege_escalation()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  suspicious_activity RECORD;
BEGIN
  -- Check for users trying to assign themselves admin roles
  FOR suspicious_activity IN
    SELECT user_id, COUNT(*) as attempt_count
    FROM public.user_roles
    WHERE assigned_by = user_id
    AND role = 'admin'
    AND assigned_at > now() - INTERVAL '1 hour'
    GROUP BY user_id
    HAVING COUNT(*) > 1
  LOOP
    -- Log potential privilege escalation attempt
    PERFORM public.log_security_event(
      'privilege_escalation_attempt',
      jsonb_build_object(
        'target_user_id', suspicious_activity.user_id,
        'attempt_count', suspicious_activity.attempt_count
      ),
      suspicious_activity.user_id
    );
  END LOOP;
END;
$function$;

-- Enhanced content safety validation function
CREATE OR REPLACE FUNCTION public.validate_content_safety(p_content text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  sanitized_content text;
  safety_score integer := 100;
  risk_patterns text[] := ARRAY[
    'script[^>]*>',
    'javascript:',
    'data:text/html',
    'vbscript:',
    'onload=',
    'onerror=',
    'eval\s*\(',
    'document\.cookie',
    'localStorage\.',
    'sessionStorage\.'
  ];
  pattern text;
  violation_count integer := 0;
BEGIN
  -- Basic validation
  IF p_content IS NULL OR length(trim(p_content)) = 0 THEN
    RETURN jsonb_build_object(
      'safe', false,
      'error', 'Content cannot be empty',
      'score', 0
    );
  END IF;

  -- Length validation (stricter)
  IF length(p_content) > 10000 THEN
    RETURN jsonb_build_object(
      'safe', false,
      'error', 'Content too long (max 10000 characters)',
      'score', 0
    );
  END IF;

  -- Initialize sanitized content
  sanitized_content := p_content;

  -- Check for malicious patterns
  FOREACH pattern IN ARRAY risk_patterns
  LOOP
    IF sanitized_content ~* pattern THEN
      violation_count := violation_count + 1;
      safety_score := safety_score - 20;
      -- Remove the malicious pattern
      sanitized_content := regexp_replace(sanitized_content, pattern, '', 'gi');
    END IF;
  END LOOP;

  -- Additional sanitization
  sanitized_content := regexp_replace(sanitized_content, '<[^>]*>', '', 'g');
  sanitized_content := trim(sanitized_content);

  -- Log security event if violations found
  IF violation_count > 0 AND p_user_id IS NOT NULL THEN
    PERFORM public.log_security_event(
      'content_safety_violation',
      jsonb_build_object(
        'violation_count', violation_count,
        'safety_score', safety_score,
        'original_length', length(p_content),
        'sanitized_length', length(sanitized_content)
      ),
      p_user_id
    );
  END IF;

  -- Determine if content is safe
  RETURN jsonb_build_object(
    'safe', safety_score >= 60,
    'sanitized_content', sanitized_content,
    'safety_score', safety_score,
    'violations_found', violation_count,
    'was_sanitized', p_content != sanitized_content
  );
END;
$function$;

-- Enhanced rate limiting function with better security
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid, p_ip_address inet, p_action text DEFAULT 'api_call')
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  rate_limit_window INTERVAL := '1 hour';
  max_requests_per_hour INTEGER := 100;
  current_requests INTEGER;
  blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current request count in the window
  SELECT COUNT(*), MAX(blocked_until)
  INTO current_requests, blocked_until
  FROM public.voice_rate_limits
  WHERE (user_id = p_user_id OR ip_address = p_ip_address)
  AND window_start > now() - rate_limit_window;

  -- Check if currently blocked
  IF blocked_until IS NOT NULL AND blocked_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'temporarily_blocked',
      'blocked_until', blocked_until,
      'current_requests', current_requests
    );
  END IF;

  -- Check rate limit
  IF current_requests >= max_requests_per_hour THEN
    -- Block for 1 hour
    INSERT INTO public.voice_rate_limits (user_id, ip_address, request_count, blocked_until)
    VALUES (p_user_id, p_ip_address, current_requests + 1, now() + INTERVAL '1 hour')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      request_count = voice_rate_limits.request_count + 1,
      blocked_until = now() + INTERVAL '1 hour',
      updated_at = now();

    -- Log security event
    PERFORM public.log_security_event(
      'rate_limit_exceeded',
      jsonb_build_object(
        'action', p_action,
        'requests_in_window', current_requests + 1,
        'max_allowed', max_requests_per_hour,
        'blocked_until', now() + INTERVAL '1 hour'
      ),
      p_user_id
    );

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'current_requests', current_requests + 1,
      'max_requests', max_requests_per_hour
    );
  END IF;

  -- Update request count
  INSERT INTO public.voice_rate_limits (user_id, ip_address, request_count)
  VALUES (p_user_id, p_ip_address, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    request_count = voice_rate_limits.request_count + 1,
    updated_at = now();

  RETURN jsonb_build_object(
    'allowed', true,
    'current_requests', current_requests + 1,
    'max_requests', max_requests_per_hour
  );
END;
$function$;

-- Enhanced admin verification with emergency access
CREATE OR REPLACE FUNCTION public.is_emergency_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  admin_count INTEGER;
  user_email TEXT;
BEGIN
  -- Get current admin count
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles ur
  JOIN auth.users u ON ur.user_id = u.id
  WHERE ur.role = 'admin'
  AND u.email_confirmed_at IS NOT NULL;

  -- If no admins exist, allow emergency access for first user
  IF admin_count = 0 THEN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = auth.uid()
    AND email_confirmed_at IS NOT NULL;
    
    -- Log emergency admin access
    IF user_email IS NOT NULL THEN
      PERFORM public.log_security_event(
        'emergency_admin_access',
        jsonb_build_object(
          'user_email', user_email,
          'reason', 'no_admins_available'
        ),
        auth.uid()
      );
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$function$;

-- Update the main admin verification function to include emergency access
CREATE OR REPLACE FUNCTION public.is_verified_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Check regular admin status first
  IF EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN auth.users u ON ur.user_id = u.id
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
    AND u.email_confirmed_at IS NOT NULL
  ) THEN
    RETURN true;
  END IF;

  -- Check emergency admin access
  RETURN public.is_emergency_admin();
END;
$function$;

-- Add constraint to ensure at least one admin always exists
CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  remaining_admins INTEGER;
BEGIN
  -- Count remaining admins after this operation
  SELECT COUNT(*) INTO remaining_admins
  FROM public.user_roles ur
  JOIN auth.users u ON ur.user_id = u.id
  WHERE ur.role = 'admin'
  AND ur.user_id != OLD.user_id
  AND u.email_confirmed_at IS NOT NULL;

  -- Prevent removal if this would be the last admin
  IF remaining_admins = 0 THEN
    RAISE EXCEPTION 'Cannot remove the last admin user. Assign admin role to another user first.';
  END IF;

  -- Log admin removal
  PERFORM public.log_security_event(
    'admin_removed',
    jsonb_build_object(
      'removed_user_id', OLD.user_id,
      'remaining_admins', remaining_admins
    ),
    auth.uid()
  );

  RETURN OLD;
END;
$function$;

-- Create trigger to prevent last admin removal
DROP TRIGGER IF EXISTS prevent_last_admin_removal_trigger ON public.user_roles;
CREATE TRIGGER prevent_last_admin_removal_trigger
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  WHEN (OLD.role = 'admin')
  EXECUTE FUNCTION public.prevent_last_admin_removal();