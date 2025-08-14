-- Fix Function Search Path Security Issues (Idempotent Migration)
-- Update all functions to have secure search_path settings

-- Fix log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_event_details jsonb DEFAULT '{}'::jsonb, p_user_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Wrap in exception block to prevent errors from breaking the app
  BEGIN
    INSERT INTO public.security_logs (event_type, event_details, user_id)
    VALUES (p_event_type, p_event_details, p_user_id);
  EXCEPTION WHEN OTHERS THEN
    -- Log to postgres logs but don't raise exception
    RAISE LOG 'Failed to log security event: % - %', SQLERRM, SQLSTATE;
  END;
END;
$function$;

-- Fix is_verified_admin function
CREATE OR REPLACE FUNCTION public.is_verified_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

-- Fix is_admin function with proper search path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$function$;

-- Fix check_user_permission function
CREATE OR REPLACE FUNCTION public.check_user_permission(p_user_id uuid, p_required_role text DEFAULT 'user'::text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has the required role or higher
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
    AND role = p_required_role::text
  ) OR public.is_verified_admin();
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create user profile with 1 free credit
  INSERT INTO public.user_profiles (id, credits_remaining, trial_used)
  VALUES (NEW.id, 1, FALSE)
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  
  RETURN NEW;
END;
$function$;

-- Fix update_timestamp function
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix is_authenticated_user function
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN auth.uid() IS NOT NULL AND auth.role() = 'authenticated';
END;
$function$;

-- Fix deduct_credits_and_log_usage function
CREATE OR REPLACE FUNCTION public.deduct_credits_and_log_usage(p_user_id uuid, p_feature_used text, p_credits_to_deduct integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT credits_remaining INTO current_credits
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF current_credits IS NULL OR current_credits < p_credits_to_deduct THEN
    RAISE EXCEPTION 'Insufficient credits for % (needed %, available %)', p_feature_used, p_credits_to_deduct, COALESCE(current_credits, 0);
  END IF;

  UPDATE public.user_profiles
  SET credits_remaining = credits_remaining - p_credits_to_deduct
  WHERE id = p_user_id;

  INSERT INTO public.usage_log (user_id, feature_used, credits_used)
  VALUES (p_user_id, p_feature_used, p_credits_to_deduct);

  RETURN TRUE;
END;
$function$;

-- Fix enhanced_log_data_access function
CREATE OR REPLACE FUNCTION public.enhanced_log_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  client_ip TEXT;
  client_info TEXT;
BEGIN
  -- Safely extract client information
  client_ip := COALESCE(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'x-real-ip',
    'unknown'
  );

  client_info := COALESCE(
    current_setting('request.headers', true)::json->>'user-agent',
    'unknown'
  );

  RETURN NEW;
END;
$function$;

-- Fix all remaining functions with search path security
CREATE OR REPLACE FUNCTION public.check_privilege_escalation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.log_admin_activity(p_action_type text, p_target_user_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;