
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
