
-- Create secure recordings table
CREATE TABLE IF NOT EXISTS public.pitch_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT,
  duration INTEGER,
  transcript TEXT, -- Consider using pgcrypto for encryption
  feedback TEXT,   -- Consider using pgcrypto for encryption
  audio_url TEXT,
  audio_content TEXT, -- Consider using pgcrypto for encryption
  score INTEGER CHECK (score >= 0 AND score <= 100),
  is_public BOOLEAN DEFAULT FALSE
);

-- Enable RLS on pitch recordings
ALTER TABLE public.pitch_recordings ENABLE ROW LEVEL SECURITY;

-- Secure RLS policies for pitch recordings
CREATE POLICY "users can view own recordings" ON public.pitch_recordings
FOR SELECT
USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "users can insert own recordings" ON public.pitch_recordings
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users can update own recordings" ON public.pitch_recordings
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "users can delete own recordings" ON public.pitch_recordings
FOR DELETE
USING (user_id = auth.uid());

-- Add update trigger
CREATE TRIGGER update_pitch_recordings_timestamp
BEFORE UPDATE ON public.pitch_recordings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Create a secure performance data table
CREATE TABLE IF NOT EXISTS public.user_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  metrics JSONB DEFAULT '{}',
  feedback_details TEXT,
  notes TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100)
);

-- Enable RLS on user performance
ALTER TABLE public.user_performance ENABLE ROW LEVEL SECURITY;

-- Secure RLS policies for user performance
CREATE POLICY "users can view own performance" ON public.user_performance
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "users can insert own performance" ON public.user_performance
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users can update own performance" ON public.user_performance
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "users can delete own performance" ON public.user_performance
FOR DELETE
USING (user_id = auth.uid());

-- Add update trigger
CREATE TRIGGER update_user_performance_timestamp
BEFORE UPDATE ON public.user_performance
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Create an auditing table to track access to sensitive data
CREATE TABLE IF NOT EXISTS public.data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  table_accessed TEXT NOT NULL,
  record_id UUID,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
  client_info TEXT,
  ip_address INET,
  success BOOLEAN DEFAULT true
);

-- Enable RLS on audit logs (only admins can see these)
ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can insert audit logs
CREATE POLICY "service_role_audit_logs" ON public.data_access_logs
FOR ALL
USING (auth.role() = 'service_role');

-- Enhanced audit logging with better error handling
CREATE OR REPLACE FUNCTION public.log_data_access()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  client_ip TEXT;
  client_info TEXT;
BEGIN
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
    
    INSERT INTO public.data_access_logs (
      user_id, 
      table_accessed, 
      record_id, 
      operation,
      client_info,
      ip_address
    )
    VALUES (
      auth.uid(),
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      TG_OP,
      client_info,
      client_ip::INET
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the main operation
      RAISE WARNING 'Failed to log data access for table %: %', TG_TABLE_NAME, SQLERRM;
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for sensitive tables
DROP TRIGGER IF EXISTS log_pitch_recordings_access ON public.pitch_recordings;
CREATE TRIGGER log_pitch_recordings_access
AFTER INSERT OR UPDATE OR DELETE ON public.pitch_recordings
FOR EACH ROW EXECUTE FUNCTION public.log_data_access();

DROP TRIGGER IF EXISTS log_user_performance_access ON public.user_performance;
CREATE TRIGGER log_user_performance_access
AFTER INSERT OR UPDATE OR DELETE ON public.user_performance
FOR EACH ROW EXECUTE FUNCTION public.log_data_access();
