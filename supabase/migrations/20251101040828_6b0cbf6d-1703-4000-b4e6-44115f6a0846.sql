-- Harden log_security_event function with validation
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text, 
  p_event_details jsonb DEFAULT '{}'::jsonb, 
  p_user_id uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_calling_user uuid := auth.uid();
  v_event_size int;
  v_allowed_event_types text[] := ARRAY[
    'auth_success', 'auth_failure', 'auth_timeout', 'session_expired',
    'rate_limit_exceeded', 'rate_limit_warning', 'rate_limit_service_error',
    'file_validation_success', 'file_validation_success_secure', 'file_upload_rejected',
    'content_safety_violation', 'voice_input_validated',
    'credits_deducted', 'credits_deducted_atomic', 'credit_purchase',
    'admin_initialized', 'admin_removed', 'emergency_admin_access',
    'privilege_escalation_attempt', 'security_headers_initialized',
    'csp_violation', 'suspicious_activity', 'data_access_attempt',
    'unauthorized_access_attempt', 'security_scan_completed'
  ];
BEGIN
  -- Validate user_id matches caller (unless called by service role for system events)
  IF p_user_id IS NOT NULL AND p_user_id != v_calling_user AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Cannot log security events for other users';
  END IF;
  
  -- Enforce size limit on event_details (5KB)
  v_event_size := pg_column_size(p_event_details);
  IF v_event_size > 5120 THEN
    RAISE EXCEPTION 'Event details exceed 5KB limit (current size: % bytes)', v_event_size;
  END IF;
  
  -- Validate event_type against whitelist
  IF p_event_type NOT IN (SELECT unnest(v_allowed_event_types)) THEN
    RAISE WARNING 'Unknown event_type "%" - consider adding to whitelist', p_event_type;
    -- Still allow but log warning for monitoring
  END IF;
  
  -- Wrap in exception block to prevent errors from breaking the app
  BEGIN
    INSERT INTO public.security_logs (event_type, event_details, user_id)
    VALUES (p_event_type, p_event_details, COALESCE(p_user_id, v_calling_user));
  EXCEPTION WHEN OTHERS THEN
    -- Log to postgres logs but don't raise exception
    RAISE LOG 'Failed to log security event: % - %', SQLERRM, SQLSTATE;
  END;
END;
$$;