-- Fix missing user profile creation trigger
-- This trigger ensures that when a new user signs up, a user_profiles record is automatically created

-- Drop the trigger if it exists (to ensure clean state)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that calls handle_new_user when a new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also ensure the handle_new_user function exists and is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Create user profile with 1 free credit
  INSERT INTO public.user_profiles (id, credits_remaining, trial_used)
  VALUES (NEW.id, 1, FALSE)
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  
  RETURN NEW;
END;
$function$;

-- Ensure any existing users without profiles get them created
INSERT INTO public.user_profiles (id, credits_remaining, trial_used)
SELECT 
  id,
  1 as credits_remaining,
  FALSE as trial_used
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;