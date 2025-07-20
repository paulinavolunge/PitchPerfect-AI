-- Security Fix Migration: Fixed Version
-- Address the role_change_log trigger issue

-- First, let's update the log_role_changes function to handle null auth.uid()
CREATE OR REPLACE FUNCTION public.log_role_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_change_log (target_user_id, changed_by, new_role, action)
    VALUES (NEW.user_id, COALESCE(auth.uid(), NEW.assigned_by, NEW.user_id), NEW.role, 'GRANTED');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.role_change_log (target_user_id, changed_by, old_role, new_role, action)
    VALUES (NEW.user_id, COALESCE(auth.uid(), NEW.assigned_by, NEW.user_id), OLD.role, NEW.role, 'MODIFIED');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_change_log (target_user_id, changed_by, old_role, action)
    VALUES (OLD.user_id, COALESCE(auth.uid(), OLD.assigned_by, OLD.user_id), OLD.role, 'REVOKED');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Fix Database Function Search Paths
CREATE OR REPLACE FUNCTION public.atomic_deduct_credits(p_user_id uuid, p_feature_used text, p_credits_to_deduct integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_credits INTEGER;
  result JSONB;
BEGIN
  SELECT credits_remaining INTO current_credits
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_credits IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User profile not found',
      'available', 0,
      'required', p_credits_to_deduct
    );
  END IF;

  IF current_credits < p_credits_to_deduct THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'available', current_credits,
      'required', p_credits_to_deduct
    );
  END IF;

  UPDATE public.user_profiles
  SET credits_remaining = credits_remaining - p_credits_to_deduct,
      updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.usage_log (user_id, feature_used, credits_used)
  VALUES (p_user_id, p_feature_used, p_credits_to_deduct);

  PERFORM public.log_security_event(
    'credits_deducted_atomic',
    jsonb_build_object(
      'feature', p_feature_used,
      'credits_used', p_credits_to_deduct,
      'remaining_credits', current_credits - p_credits_to_deduct
    ),
    p_user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_used', p_credits_to_deduct,
    'remaining_credits', current_credits - p_credits_to_deduct
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_verified_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN auth.users u ON ur.user_id = u.id
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
    AND u.email_confirmed_at IS NOT NULL
  );
END;
$function$;

-- Remove Duplicate RLS Policies
DROP POLICY IF EXISTS "pitch_recordings_select_own" ON public.pitch_recordings;
DROP POLICY IF EXISTS "pitch_recordings_insert_own" ON public.pitch_recordings;
DROP POLICY IF EXISTS "pitch_recordings_update_own" ON public.pitch_recordings;
DROP POLICY IF EXISTS "pitch_recordings_delete_own" ON public.pitch_recordings;

DROP POLICY IF EXISTS "user_performance_select_own" ON public.user_performance;
DROP POLICY IF EXISTS "user_performance_insert_own" ON public.user_performance;
DROP POLICY IF EXISTS "user_performance_update_own" ON public.user_performance;
DROP POLICY IF EXISTS "user_performance_delete_own" ON public.user_performance;

DROP POLICY IF EXISTS "Users can insert own usage log." ON public.usage_log;
DROP POLICY IF EXISTS "Users can view own usage log." ON public.usage_log;

DROP POLICY IF EXISTS "Users can view own profile." ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.user_profiles;

-- Initialize Admin System
CREATE OR REPLACE FUNCTION public.initialize_admin_system()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  admin_count INTEGER;
  first_user_id UUID;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';

  IF admin_count = 0 THEN
    SELECT id INTO first_user_id
    FROM auth.users
    WHERE email_confirmed_at IS NOT NULL
    ORDER BY created_at ASC
    LIMIT 1;

    IF first_user_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role, assigned_by)
      VALUES (first_user_id, 'admin', first_user_id)
      ON CONFLICT (user_id, role) DO NOTHING;

      PERFORM public.log_security_event(
        'admin_initialized',
        jsonb_build_object(
          'admin_user_id', first_user_id,
          'method', 'automatic_first_user'
        ),
        first_user_id
      );
    END IF;
  END IF;
END;
$function$;

-- Call the admin initialization function
SELECT public.initialize_admin_system();

-- Enhanced Security Event Logging
ALTER TABLE public.security_events DROP CONSTRAINT IF EXISTS security_events_event_type_check;

ALTER TABLE public.security_events ADD CONSTRAINT security_events_event_type_check 
CHECK (event_type IN (
  'failed_login', 
  'suspicious_activity', 
  'rate_limit_exceeded', 
  'unauthorized_access_attempt',
  'credits_deducted_atomic',
  'credits_deducted',
  'file_validation_success_secure',
  'file_validation_success',
  'voice_input_validated',
  'rate_limit_cleanup',
  'security_health_check',
  'admin_initialized',
  'privilege_escalation_attempt',
  'content_safety_violation'
));