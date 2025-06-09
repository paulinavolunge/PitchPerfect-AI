
-- Security Enhancement Phase 1: RLS Policy Refinement and Additional Security Tables

-- Create enhanced audit logging for security events
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('failed_login', 'suspicious_activity', 'rate_limit_exceeded', 'unauthorized_access_attempt')),
  event_details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Only admins can view security events" ON public.security_events
FOR SELECT
USING (public.is_verified_admin());

-- System can insert security events
CREATE POLICY "System can insert security events" ON public.security_events
FOR INSERT
WITH CHECK (true);

-- Add more granular RLS policy for pitch_recordings public access
CREATE POLICY "Prevent unauthorized public manipulation" ON public.pitch_recordings
FOR UPDATE
USING (user_id = auth.uid() OR public.is_verified_admin());

-- Add RLS policies for usage_log (currently missing)
ALTER TABLE public.usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs" ON public.usage_log
FOR SELECT
USING (user_id = auth.uid() OR public.is_verified_admin());

CREATE POLICY "System can insert usage logs" ON public.usage_log
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Add RLS policies for user_performance (currently missing)
ALTER TABLE public.user_performance ENABLE ROW LEVEL SECURITY;

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

-- Create function for logging security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_event_details JSONB DEFAULT '{}',
  p_user_id UUID DEFAULT NULL
) RETURNS VOID AS $$
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
    -- Log the error but don't fail the main operation
    RAISE WARNING 'Failed to log security event: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced rate limiting for voice processing with better security
CREATE TABLE IF NOT EXISTS public.voice_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_address INET NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on voice rate limits
ALTER TABLE public.voice_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits" ON public.voice_rate_limits
FOR SELECT
USING (user_id = auth.uid() OR public.is_verified_admin());

CREATE POLICY "System can manage rate limits" ON public.voice_rate_limits
FOR ALL
USING (true);
