-- Add onboarding_completed field to user_profiles table

-- Add the column if it doesn't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing users who have completed onboarding based on localStorage
-- This is a one-time migration to sync existing data
COMMENT ON COLUMN public.user_profiles.onboarding_completed IS 'Tracks whether the user has completed the onboarding flow';