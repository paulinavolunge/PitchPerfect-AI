
-- Create practice_sessions table to store roleplay session data
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scenario_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  industry TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  score INTEGER,
  transcript JSONB,
  feedback_data JSONB,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for practice_sessions
CREATE POLICY "Users can view their own practice sessions" 
  ON public.practice_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice sessions" 
  ON public.practice_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice sessions" 
  ON public.practice_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add update trigger for practice_sessions
CREATE TRIGGER update_practice_sessions_timestamp
  BEFORE UPDATE ON public.practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
