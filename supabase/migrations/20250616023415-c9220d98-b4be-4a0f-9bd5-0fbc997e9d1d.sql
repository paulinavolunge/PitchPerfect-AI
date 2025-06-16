
-- Phase 1: Critical RLS Policy Implementation (Targeted Fix)

-- Drop existing conflicting policies first (more comprehensive)
DROP POLICY IF EXISTS "Only admins can view security events" ON public.security_events;
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;
DROP POLICY IF EXISTS "users can view own recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "users can insert own recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "users can update own recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "users can delete own recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "Prevent unauthorized public manipulation" ON public.pitch_recordings;
DROP POLICY IF EXISTS "Users can view own usage logs" ON public.usage_log;
DROP POLICY IF EXISTS "System can insert usage logs" ON public.usage_log;
DROP POLICY IF EXISTS "Users can view own performance" ON public.user_performance;
DROP POLICY IF EXISTS "Users can insert own performance" ON public.user_performance;
DROP POLICY IF EXISTS "Users can update own performance" ON public.user_performance;
DROP POLICY IF EXISTS "Users can delete own performance" ON public.user_performance;
DROP POLICY IF EXISTS "Users can view own rate limits" ON public.voice_rate_limits;
DROP POLICY IF EXISTS "System can manage rate limits" ON public.voice_rate_limits;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Enable RLS on missing tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for user_profiles (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON public.user_profiles
        FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.user_profiles
        FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Admins can view all profiles') THEN
        CREATE POLICY "Admins can view all profiles" ON public.user_profiles
        FOR SELECT USING (public.is_verified_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Admins can update all profiles') THEN
        CREATE POLICY "Admins can update all profiles" ON public.user_profiles
        FOR UPDATE USING (public.is_verified_admin());
    END IF;
END $$;

-- Create RLS policies for sales_scripts
CREATE POLICY "Users can view own scripts or public scripts" ON public.sales_scripts
FOR SELECT
USING (user_id = auth.uid() OR is_public = true OR public.is_verified_admin());

CREATE POLICY "Users can insert own scripts" ON public.sales_scripts
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own scripts" ON public.sales_scripts
FOR UPDATE
USING (user_id = auth.uid() OR public.is_verified_admin());

CREATE POLICY "Users can delete own scripts" ON public.sales_scripts
FOR DELETE
USING (user_id = auth.uid() OR public.is_verified_admin());

-- Create RLS policies for auth_rate_limits
CREATE POLICY "System can manage auth rate limits" ON public.auth_rate_limits
FOR ALL
USING (true);

-- Recreate security_events policies
CREATE POLICY "Only admins can view security events" ON public.security_events
FOR SELECT
USING (public.is_verified_admin());

CREATE POLICY "System can insert security events" ON public.security_events
FOR INSERT
WITH CHECK (true);

-- Create RLS policies for voice_rate_limits
CREATE POLICY "Users can view own rate limits" ON public.voice_rate_limits
FOR SELECT
USING (user_id = auth.uid() OR public.is_verified_admin());

CREATE POLICY "System can manage rate limits" ON public.voice_rate_limits
FOR ALL
USING (true);

-- Create RLS policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT
USING (user_id = auth.uid() OR public.is_verified_admin());

CREATE POLICY "Only admins can manage roles" ON public.user_roles
FOR ALL
USING (public.is_verified_admin());

-- Recreate improved policies for existing tables
CREATE POLICY "Users can view own recordings" ON public.pitch_recordings
FOR SELECT
USING (user_id = auth.uid() OR is_public = true OR public.is_verified_admin());

CREATE POLICY "Users can insert own recordings" ON public.pitch_recordings
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recordings" ON public.pitch_recordings
FOR UPDATE
USING (user_id = auth.uid() OR public.is_verified_admin());

CREATE POLICY "Users can delete own recordings" ON public.pitch_recordings
FOR DELETE
USING (user_id = auth.uid() OR public.is_verified_admin());

-- Recreate usage_log policies
CREATE POLICY "Users can view own usage logs" ON public.usage_log
FOR SELECT
USING (user_id = auth.uid() OR public.is_verified_admin());

CREATE POLICY "System can insert usage logs" ON public.usage_log
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Recreate user_performance policies
CREATE POLICY "Users can view own performance" ON public.user_performance
FOR SELECT
USING (user_id = auth.uid() OR public.is_verified_admin());

CREATE POLICY "Users can insert own performance" ON public.user_performance
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own performance" ON public.user_performance
FOR UPDATE
USING (user_id = auth.uid() OR public.is_verified_admin());

CREATE POLICY "Users can delete own performance" ON public.user_performance
FOR DELETE
USING (user_id = auth.uid() OR public.is_verified_admin());

-- Fix the secure_deduct_credits_and_log_usage function to work properly
CREATE OR REPLACE FUNCTION public.secure_deduct_credits_and_log_usage(
  p_user_id uuid, 
  p_feature_used text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_credits INTEGER;
  credits_to_deduct INTEGER := 1; -- Default to 1 credit
  result jsonb;
BEGIN
  -- Get current credits
  SELECT credits_remaining INTO current_credits
  FROM public.user_profiles
  WHERE id = p_user_id;

  -- Check if user exists and has sufficient credits
  IF current_credits IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User profile not found',
      'available', 0,
      'required', credits_to_deduct
    );
  END IF;

  IF current_credits < credits_to_deduct THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'available', current_credits,
      'required', credits_to_deduct
    );
  END IF;

  -- Deduct credits
  UPDATE public.user_profiles
  SET credits_remaining = credits_remaining - credits_to_deduct,
      updated_at = now()
  WHERE id = p_user_id;

  -- Log usage
  INSERT INTO public.usage_log (user_id, feature_used, credits_used)
  VALUES (p_user_id, p_feature_used, credits_to_deduct);

  -- Log security event
  PERFORM public.log_security_event(
    'credits_deducted',
    jsonb_build_object(
      'feature', p_feature_used,
      'credits_used', credits_to_deduct,
      'remaining_credits', current_credits - credits_to_deduct
    ),
    p_user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_used', credits_to_deduct,
    'remaining_credits', current_credits - credits_to_deduct
  );
END;
$$;

-- Create enhanced security function for voice input validation
CREATE OR REPLACE FUNCTION public.validate_voice_input(
  p_input text,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  sanitized_input text;
  validation_result jsonb;
BEGIN
  -- Basic validation
  IF p_input IS NULL OR length(trim(p_input)) = 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Input cannot be empty'
    );
  END IF;

  -- Length validation
  IF length(p_input) > 5000 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Input too long (max 5000 characters)'
    );
  END IF;

  -- Sanitize input (basic XSS protection)
  sanitized_input := regexp_replace(p_input, '<[^>]*>', '', 'g');
  sanitized_input := regexp_replace(sanitized_input, 'javascript:', '', 'gi');
  sanitized_input := regexp_replace(sanitized_input, 'data:', '', 'gi');
  sanitized_input := trim(sanitized_input);

  -- Log security event if user provided
  IF p_user_id IS NOT NULL THEN
    PERFORM public.log_security_event(
      'voice_input_validated',
      jsonb_build_object(
        'original_length', length(p_input),
        'sanitized_length', length(sanitized_input),
        'sanitized', p_input != sanitized_input
      ),
      p_user_id
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'sanitized_input', sanitized_input,
    'was_sanitized', p_input != sanitized_input
  );
END;
$$;

-- Create function to check user permissions securely
CREATE OR REPLACE FUNCTION public.check_user_permission(
  p_user_id uuid,
  p_required_role text DEFAULT 'user'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user has the required role or higher
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
    AND role = p_required_role::text
  ) OR public.is_verified_admin();
END;
$$;
