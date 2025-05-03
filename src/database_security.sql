
-- Create secure RLS policies for sensitive data tables

-- Enable Row Level Security on all tables
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Secure recordings table (assuming it exists or will be created)
CREATE TABLE IF NOT EXISTS public.pitch_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT,
  duration INTEGER,
  transcript TEXT, -- Will be encrypted at the application level
  feedback TEXT, -- Will be encrypted at the application level
  audio_url TEXT,
  audio_content TEXT, -- Will be encrypted at the application level
  score INTEGER,
  is_public BOOLEAN DEFAULT FALSE
);

-- Enable RLS on pitch recordings
ALTER TABLE public.pitch_recordings ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own recordings
CREATE POLICY "users can view own recordings" ON public.pitch_recordings
FOR SELECT
USING (user_id = auth.uid());

-- Allow users to insert their own recordings
CREATE POLICY "users can insert own recordings" ON public.pitch_recordings
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own recordings
CREATE POLICY "users can update own recordings" ON public.pitch_recordings
FOR UPDATE
USING (user_id = auth.uid());

-- Allow users to delete their own recordings
CREATE POLICY "users can delete own recordings" ON public.pitch_recordings
FOR DELETE
USING (user_id = auth.uid());

-- Create a secure performance data table
CREATE TABLE IF NOT EXISTS public.user_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  metrics JSONB, -- Store general performance metrics
  feedback_details TEXT, -- Will be encrypted at the application level
  notes TEXT, -- Will be encrypted at the application level
  score INTEGER
);

-- Enable RLS on user performance
ALTER TABLE public.user_performance ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own performance data
CREATE POLICY "users can view own performance" ON public.user_performance
FOR SELECT
USING (user_id = auth.uid());

-- Allow users to insert their own performance data
CREATE POLICY "users can insert own performance" ON public.user_performance
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own performance data
CREATE POLICY "users can update own performance" ON public.user_performance
FOR UPDATE
USING (user_id = auth.uid());

-- Allow users to delete their own performance data
CREATE POLICY "users can delete own performance" ON public.user_performance
FOR DELETE
USING (user_id = auth.uid());

-- Create an auditing table to track access to sensitive data
CREATE TABLE IF NOT EXISTS public.data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  table_accessed TEXT NOT NULL,
  record_id UUID,
  operation TEXT NOT NULL,
  client_info TEXT,
  ip_address TEXT
);

-- Function to log data access
CREATE OR REPLACE FUNCTION public.log_data_access()
RETURNS TRIGGER AS $$
BEGIN
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
    NEW.id,
    TG_OP,
    current_setting('request.headers', true)::json->>'x-client-info',
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for sensitive tables
CREATE TRIGGER log_pitch_recordings_access
AFTER INSERT OR UPDATE OR DELETE ON public.pitch_recordings
FOR EACH ROW EXECUTE FUNCTION public.log_data_access();

CREATE TRIGGER log_user_performance_access
AFTER INSERT OR UPDATE OR DELETE ON public.user_performance
FOR EACH ROW EXECUTE FUNCTION public.log_data_access();
