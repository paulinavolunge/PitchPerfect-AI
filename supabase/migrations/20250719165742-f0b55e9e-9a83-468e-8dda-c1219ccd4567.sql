-- Security Fix Phase 1: Critical Database Function Security
-- Fix search path vulnerability in database functions

-- 1. Fix atomic_deduct_credits function
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

-- 2. Fix secure_validate_file_upload function
CREATE OR REPLACE FUNCTION public.secure_validate_file_upload(p_file_name text, p_file_size bigint, p_file_type text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  max_size_bytes BIGINT := 25 * 1024 * 1024; -- Reduced to 25MB for security
  allowed_types TEXT[] := ARRAY[
    'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/aac'
  ]; -- Removed potentially risky formats
  sanitized_name TEXT;
BEGIN
  -- Strict file name validation and sanitization
  IF p_file_name IS NULL OR length(trim(p_file_name)) = 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid file name'
    );
  END IF;

  -- Sanitize file name - remove dangerous characters
  sanitized_name := regexp_replace(
    regexp_replace(p_file_name, '[^\w\-_\.]', '_', 'g'),
    '\.+', '.', 'g'
  );

  -- File size validation (stricter limit)
  IF p_file_size > max_size_bytes THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'File too large',
      'max_size_mb', max_size_bytes / (1024 * 1024)
    );
  END IF;

  -- Strict file type validation
  IF NOT (p_file_type = ANY(allowed_types)) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid file type',
      'allowed_types', array_to_json(allowed_types)
    );
  END IF;

  -- Log successful validation with more details
  IF p_user_id IS NOT NULL THEN
    PERFORM public.log_security_event(
      'file_validation_success_secure',
      jsonb_build_object(
        'file_type', p_file_type,
        'file_size', p_file_size,
        'original_name', p_file_name,
        'sanitized_name', sanitized_name
      ),
      p_user_id
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'sanitized_name', sanitized_name
  );
END;
$function$;

-- 3. Fix deduct_credits_and_log_usage function
CREATE OR REPLACE FUNCTION public.deduct_credits_and_log_usage(p_user_id uuid, p_feature_used text, p_credits_to_deduct integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

-- 4. Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, credits_remaining, trial_used)
  VALUES (NEW.id, 1, FALSE); -- Free credit on signup
  RETURN NEW;
END;
$function$;

-- 5. Fix update_timestamp function
CREATE OR REPLACE FUNCTION public.update_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 6. Fix secure_deduct_credits_and_log_usage function
CREATE OR REPLACE FUNCTION public.secure_deduct_credits_and_log_usage(p_user_id uuid, p_feature_used text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- 7. Fix validate_voice_input function
CREATE OR REPLACE FUNCTION public.validate_voice_input(p_input text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- 8. Fix validate_file_upload function
CREATE OR REPLACE FUNCTION public.validate_file_upload(p_file_name text, p_file_size bigint, p_file_type text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  max_size_bytes BIGINT := 50 * 1024 * 1024; -- 50MB
  allowed_types TEXT[] := ARRAY[
    'audio/wav', 'audio/mp3', 'audio/mpeg', 
    'audio/m4a', 'audio/webm', 'audio/ogg', 'audio/aac'
  ];
  validation_result JSONB;
BEGIN
  -- File size validation
  IF p_file_size > max_size_bytes THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'File too large',
      'max_size_mb', max_size_bytes / (1024 * 1024)
    );
  END IF;

  -- File type validation
  IF NOT (p_file_type = ANY(allowed_types)) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid file type',
      'allowed_types', array_to_json(allowed_types)
    );
  END IF;

  -- File name validation (basic sanitization check)
  IF p_file_name IS NULL OR length(trim(p_file_name)) = 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid file name'
    );
  END IF;

  -- Log successful validation
  IF p_user_id IS NOT NULL THEN
    PERFORM public.log_security_event(
      'file_validation_success',
      jsonb_build_object(
        'file_type', p_file_type,
        'file_size', p_file_size,
        'file_name_length', length(p_file_name)
      ),
      p_user_id
    );
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$function$;

-- 9. Fix cleanup_expired_rate_limits function
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Clean up rate limit records older than 24 hours
  DELETE FROM public.voice_rate_limits 
  WHERE created_at < (now() - INTERVAL '24 hours')
  AND (blocked_until IS NULL OR blocked_until < now());
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup activity
  PERFORM public.log_security_event(
    'rate_limit_cleanup',
    jsonb_build_object('records_cleaned', deleted_count)
  );
  
  RETURN deleted_count;
END;
$function$;

-- 10. Fix security_health_check function
CREATE OR REPLACE FUNCTION public.security_health_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  result JSONB;
  recent_events INTEGER;
  blocked_users INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count recent security events (last hour)
  SELECT COUNT(*) INTO recent_events
  FROM public.security_events
  WHERE created_at > (now() - INTERVAL '1 hour');

  -- Count currently blocked users
  SELECT COUNT(*) INTO blocked_users
  FROM public.voice_rate_limits
  WHERE blocked_until > now();

  -- Count active RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  result := jsonb_build_object(
    'timestamp', now(),
    'status', 'healthy',
    'metrics', jsonb_build_object(
      'recent_security_events', recent_events,
      'blocked_users', blocked_users,
      'active_policies', policy_count
    )
  );

  -- Log health check
  PERFORM public.log_security_event(
    'security_health_check',
    result
  );

  RETURN result;
END;
$function$;