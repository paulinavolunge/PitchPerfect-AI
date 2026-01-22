-- Change default credits for new users from 0 to 5
ALTER TABLE public.user_profiles 
ALTER COLUMN credits_remaining SET DEFAULT 5;

-- Also update the handle_new_user trigger if it exists to ensure new profiles get 5 credits
-- First, let's update any existing users with 0 credits who haven't used the app yet
-- (only if they have trial_used = false, meaning they haven't started)
UPDATE public.user_profiles 
SET credits_remaining = 5 
WHERE credits_remaining = 0 AND trial_used = false;