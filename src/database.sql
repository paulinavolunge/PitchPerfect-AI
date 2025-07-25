
-- Create shared utility functions first
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create subscribers table to track subscription information
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- SECURE: Fixed policies with proper user scoping
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Add update trigger
CREATE TRIGGER update_subscribers_timestamp
BEFORE UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
-- Create user_profiles table for custom user data like credits and trial status
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 0 CHECK (credits_remaining >= 0),
  trial_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles:
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile." ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- New profiles are created automatically on user signup via a trigger (see below)
CREATE POLICY "Allow authenticated users to insert their own profile." ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Add update trigger for user_profiles
CREATE TRIGGER update_user_profiles_timestamp
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Function to create a public.user_profiles entry for new auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, credits_remaining, trial_used)
  VALUES (NEW.id, 1, FALSE); -- Grant 1 free pitch analysis on signup
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run handle_new_user function on new auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Create usage_log table to track feature usage and credit deductions
CREATE TABLE IF NOT EXISTS public.usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  feature_used TEXT NOT NULL, -- e.g., 'text_pitch_analysis', 'voice_roleplay_medium', 'voice_roleplay_hard'
  credits_used INTEGER NOT NULL CHECK (credits_used > 0)
);

-- Enable Row Level Security for usage_log
ALTER TABLE public.usage_log ENABLE ROW LEVEL SECURITY;

-- Policies for usage_log:
-- Users can view their own usage history
CREATE POLICY "Users can view own usage log." ON public.usage_log
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own usage log entries (only via the RPC function)
CREATE POLICY "Users can insert own usage log." ON public.usage_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to deduct credits and log usage
CREATE OR REPLACE FUNCTION public.deduct_credits_and_log_usage(
  p_user_id UUID,
  p_feature_used TEXT,
  p_credits_to_deduct INTEGER
)
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits_remaining INTO current_credits
  FROM public.user_profiles
  WHERE id = p_user_id;

  -- Check if user has enough credits
  IF current_credits IS NULL OR current_credits < p_credits_to_deduct THEN
    RAISE EXCEPTION 'Insufficient credits for % (needed % , available %)', p_feature_used, p_credits_to_deduct, COALESCE(current_credits, 0);
  END IF;

  -- Deduct credits
  UPDATE public.user_profiles
  SET credits_remaining = credits_remaining - p_credits_to_deduct
  WHERE id = p_user_id;

  -- Log the usage
  INSERT INTO public.usage_log (user_id, feature_used, credits_used)
  VALUES (p_user_id, p_feature_used, p_credits_to_deduct);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
