
-- Security Optimization Phase 1: Policy Consolidation and Enhancement

-- First, let's clean up duplicate RLS policies and consolidate them
-- Drop existing duplicate policies to avoid conflicts
DROP POLICY IF EXISTS "users can view own recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "users can insert own recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "users can update own recordings" ON public.pitch_recordings;
DROP POLICY IF EXISTS "users can delete own recordings" ON public.pitch_recordings;

-- Create consolidated, standardized RLS policies for pitch_recordings
CREATE POLICY "pitch_recordings_select_own" ON public.pitch_recordings
  FOR SELECT USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "pitch_recordings_insert_own" ON public.pitch_recordings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "pitch_recordings_update_own" ON public.pitch_recordings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "pitch_recordings_delete_own" ON public.pitch_recordings
  FOR DELETE USING (user_id = auth.uid());

-- Consolidate user_performance policies (remove duplicates)
DROP POLICY IF EXISTS "users can view own performance" ON public.user_performance;
DROP POLICY IF EXISTS "users can insert own performance" ON public.user_performance;
DROP POLICY IF EXISTS "users can update own performance" ON public.user_performance;
DROP POLICY IF EXISTS "users can delete own performance" ON public.user_performance;

CREATE POLICY "user_performance_select_own" ON public.user_performance
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_performance_insert_own" ON public.user_performance
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_performance_update_own" ON public.user_performance
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_performance_delete_own" ON public.user_performance
  FOR DELETE USING (user_id = auth.uid());

-- Enhanced security event logging with better data retention
CREATE TABLE IF NOT EXISTS public.security_audit_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_type TEXT NOT NULL,
  event_count INTEGER DEFAULT 1,
  severity_level TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date, event_type)
);

-- Enable RLS on audit summary
ALTER TABLE public.security_audit_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_only_audit_summary" ON public.security_audit_summary
  FOR ALL USING (public.is_verified_admin());

-- Enhanced server-side file validation function
CREATE OR REPLACE FUNCTION public.validate_file_upload(
  p_file_name TEXT,
  p_file_size BIGINT,
  p_file_type TEXT,
  p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced rate limiting cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security health check function
CREATE OR REPLACE FUNCTION public.security_health_check()
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
