-- Update the handle_new_user trigger to give 5 credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create user profile with 5 free credits
  INSERT INTO public.user_profiles (id, credits_remaining, trial_used)
  VALUES (NEW.id, 5, FALSE)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;