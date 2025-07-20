-- Security Fix Migration: Address Critical Database Security Issues

-- Phase 1: Fix Database Function Search Paths
-- Update all functions to have proper search_path settings

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
  -- Lock the user profile row to prevent race conditions
  SELECT credits_remaining INTO current_credits
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user exists and has sufficient credits
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

  -- Atomically deduct credits
  UPDATE public.user_profiles
  SET credits_remaining = credits_remaining - p_credits_to_deduct,
      updated_at = now()
  WHERE id = p_user_id;

  -- Log usage in same transaction
  INSERT INTO public.usage_log (user_id, feature_used, credits_used)
  VALUES (p_user_id, p_feature_used, p_credits_to_deduct);

  -- Log security event
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

CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_event_details jsonb DEFAULT '{}'::jsonb, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    event_details,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(p_user_id, auth.uid()),
    p_event_type,
    p_event_details,
    COALESCE(
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      current_setting('request.headers', true)::json->>'x-real-ip'
    )::INET,
    current_setting('request.headers', true)::json->>'user-agent'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log security event: %', SQLERRM;
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

-- Phase 2: Remove Duplicate RLS Policies
-- Keep the "_secure" versions which include admin access

-- Drop duplicate policies for pitch_recordings
DROP POLICY IF EXISTS "pitch_recordings_select_own" ON public.pitch_recordings;
DROP POLICY IF EXISTS "pitch_recordings_insert_own" ON public.pitch_recordings;
DROP POLICY IF EXISTS "pitch_recordings_update_own" ON public.pitch_recordings;
DROP POLICY IF EXISTS "pitch_recordings_delete_own" ON public.pitch_recordings;

-- Drop duplicate policies for user_performance
DROP POLICY IF EXISTS "user_performance_select_own" ON public.user_performance;
DROP POLICY IF EXISTS "user_performance_insert_own" ON public.user_performance;
DROP POLICY IF EXISTS "user_performance_update_own" ON public.user_performance;
DROP POLICY IF EXISTS "user_performance_delete_own" ON public.user_performance;

-- Drop duplicate policies for usage_log
DROP POLICY IF EXISTS "Users can insert own usage log." ON public.usage_log;
DROP POLICY IF EXISTS "Users can view own usage log." ON public.usage_log;

-- Drop duplicate policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile." ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.user_profiles;

-- Phase 3: Initialize User Roles System
-- Create a function to safely assign admin role to the first user
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
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';

  -- If no admin exists, make the first user an admin
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

      -- Log the admin creation
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

-- Phase 4: Enhanced Security Event Logging
-- Add missing event types to the security_events table check constraint
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

-- Phase 5: Add Security Monitoring Function
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
    AND created_at > now() - INTERVAL '1 hour'
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