-- Fix security logging function to handle errors gracefully

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.log_security_event CASCADE;

-- Create a simple security events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_details JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);

-- Create the RPC function with proper error handling
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_event_details JSONB DEFAULT '{}'::jsonb,
  p_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input
  IF p_event_type IS NULL OR p_event_type = '' THEN
    RETURN; -- Silently fail for invalid input
  END IF;

  -- Attempt to insert the event
  BEGIN
    INSERT INTO public.security_events (
      event_type,
      event_details,
      user_id,
      created_at
    ) VALUES (
      p_event_type,
      COALESCE(p_event_details, '{}'::jsonb),
      p_user_id,
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Silently fail on any error to prevent cascading failures
      NULL;
  END;

  -- Clean up old events (keep only last 30 days)
  BEGIN
    DELETE FROM public.security_events
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND ctid IN (
      SELECT ctid FROM public.security_events
      WHERE created_at < NOW() - INTERVAL '30 days'
      LIMIT 1000
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Silently fail cleanup
      NULL;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;

-- Add RLS policies
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Policy for inserting events (users can only insert their own events)
CREATE POLICY "Users can insert their own security events"
  ON public.security_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Policy for reading events (users can only read their own events)
CREATE POLICY "Users can read their own security events"
  ON public.security_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Add rate limiting comment
COMMENT ON FUNCTION public.log_security_event IS 'Logs security events with automatic cleanup. Rate limited by application layer.';