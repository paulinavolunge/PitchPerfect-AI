-- Fix RPC functions to handle errors gracefully

-- Ensure log_security_event function exists and handles errors
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_event_details jsonb DEFAULT '{}'::jsonb,
  p_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Create a simple health check function if it doesn't exist
CREATE OR REPLACE FUNCTION public.security_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- Simple health check
  result = jsonb_build_object(
    'status', 'healthy',
    'timestamp', now(),
    'checks', jsonb_build_object(
      'database', 'ok',
      'security_logs_table', (
        SELECT CASE 
          WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'security_logs'
          ) THEN 'ok' 
          ELSE 'missing' 
        END
      )
    )
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'error', SQLERRM,
    'timestamp', now()
  );
END;
$function$;

-- Ensure security_logs table exists
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_details JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at);

-- Grant necessary permissions
GRANT INSERT ON public.security_logs TO authenticated;
GRANT SELECT ON public.security_logs TO authenticated;