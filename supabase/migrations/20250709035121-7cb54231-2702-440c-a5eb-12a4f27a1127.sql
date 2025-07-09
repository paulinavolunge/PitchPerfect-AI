-- Security Fix Phase 1: Critical RLS Policy Cleanup
-- Remove duplicate and conflicting RLS policies

-- Clean up pitch_recordings table policies
DROP POLICY IF EXISTS "Users can view own recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "Users can insert own recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "Users can update own recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "Users can delete own recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "users_can_view_own_pitch_recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "users_can_insert_own_pitch_recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "users_can_update_own_pitch_recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "users_can_delete_own_pitch_recordings" ON public.pitch_recordings;

-- Create consolidated, secure pitch_recordings policies
CREATE POLICY "pitch_recordings_select_secure" ON public.pitch_recordings
  FOR SELECT USING (user_id = auth.uid() OR is_public = true OR is_verified_admin());

CREATE POLICY "pitch_recordings_insert_secure" ON public.pitch_recordings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "pitch_recordings_update_secure" ON public.pitch_recordings
  FOR UPDATE USING (user_id = auth.uid() OR is_verified_admin());

CREATE POLICY "pitch_recordings_delete_secure" ON public.pitch_recordings
  FOR DELETE USING (user_id = auth.uid() OR is_verified_admin());

-- Clean up user_performance table policies
DROP POLICY IF EXISTS "Users can view own performance" ON public.user_performance;
DROP POLICY IF EXISTS "Users can insert own performance" ON public.user_performance;
DROP POLICY IF EXISTS "Users can update own performance" ON public.user_performance;
DROP POLICY IF EXISTS "Users can delete own performance" ON public.user_performance;
DROP POLICY IF EXISTS "users_can_view_own_user_performance" ON public.user_performance;
DROP POLICY IF EXISTS "users_can_insert_own_user_performance" ON public.user_performance;
DROP POLICY IF EXISTS "users_can_update_own_user_performance" ON public.user_performance;
DROP POLICY IF EXISTS "users_can_delete_own_user_performance" ON public.user_performance;

-- Create consolidated, secure user_performance policies
CREATE POLICY "user_performance_select_secure" ON public.user_performance
  FOR SELECT USING (user_id = auth.uid() OR is_verified_admin());

CREATE POLICY "user_performance_insert_secure" ON public.user_performance
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_performance_update_secure" ON public.user_performance
  FOR UPDATE USING (user_id = auth.uid() OR is_verified_admin());

CREATE POLICY "user_performance_delete_secure" ON public.user_performance
  FOR DELETE USING (user_id = auth.uid() OR is_verified_admin());

-- Clean up sales_scripts table policies
DROP POLICY IF EXISTS "Users can view own scripts or public scripts" ON public.sales_scripts;
DROP POLICY IF EXISTS "Users can insert own scripts" ON public.sales_scripts;
DROP POLICY IF EXISTS "Users can update own scripts" ON public.sales_scripts;
DROP POLICY IF EXISTS "Users can delete own scripts" ON public.sales_scripts;
DROP POLICY IF EXISTS "users_can_view_own_or_public_sales_scripts" ON public.sales_scripts;
DROP POLICY IF EXISTS "users_can_insert_own_sales_scripts" ON public.sales_scripts;
DROP POLICY IF EXISTS "users_can_update_own_sales_scripts" ON public.sales_scripts;
DROP POLICY IF EXISTS "users_can_delete_own_sales_scripts" ON public.sales_scripts;

-- Create consolidated, secure sales_scripts policies
CREATE POLICY "sales_scripts_select_secure" ON public.sales_scripts
  FOR SELECT USING (user_id = auth.uid() OR is_public = true OR is_verified_admin());

CREATE POLICY "sales_scripts_insert_secure" ON public.sales_scripts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "sales_scripts_update_secure" ON public.sales_scripts
  FOR UPDATE USING (user_id = auth.uid() OR is_verified_admin());

CREATE POLICY "sales_scripts_delete_secure" ON public.sales_scripts
  FOR DELETE USING (user_id = auth.uid() OR is_verified_admin());

-- Enhanced atomic credit deduction function with race condition protection
CREATE OR REPLACE FUNCTION public.atomic_deduct_credits(
  p_user_id UUID,
  p_feature_used TEXT,
  p_credits_to_deduct INTEGER DEFAULT 1
) RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced file validation function with stricter security
CREATE OR REPLACE FUNCTION public.secure_validate_file_upload(
  p_file_name TEXT,
  p_file_size BIGINT,
  p_file_type TEXT,
  p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced error sanitization function
CREATE OR REPLACE FUNCTION public.sanitize_error_message(
  p_error_message TEXT
) RETURNS TEXT AS $$
BEGIN
  IF p_error_message IS NULL THEN
    RETURN 'An error occurred';
  END IF;

  -- Remove sensitive patterns more aggressively
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(p_error_message, 
              'password|secret|key|token|api[_-]?key|bearer|auth', '[REDACTED]', 'gi'),
            '\b\d{4,}\b', '[ID]', 'g'), -- Long numbers
          '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[EMAIL]', 'g'), -- Emails
        'https?://[^\s]+', '[URL]', 'gi'), -- URLs
      'Bearer\s+[^\s]+', 'Bearer [TOKEN]', 'gi'), -- Bearer tokens
    '\b[A-Za-z0-9+/=]{20,}\b', '[ENCODED]', 'g'); -- Base64-like strings
END;
$$ LANGUAGE plpgsql IMMUTABLE;