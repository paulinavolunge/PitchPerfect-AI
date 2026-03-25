-- Fix deduct_credits_and_log_usage: add caller ownership check and positive-value validation
CREATE OR REPLACE FUNCTION public.deduct_credits_and_log_usage(p_user_id uuid, p_feature_used text, p_credits_to_deduct integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_credits INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() != p_user_id AND NOT public.is_verified_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_credits_to_deduct <= 0 THEN
    RAISE EXCEPTION 'Credits to deduct must be positive';
  END IF;

  SELECT credits_remaining INTO current_credits
  FROM public.user_profiles WHERE id = p_user_id;

  IF current_credits IS NULL OR current_credits < p_credits_to_deduct THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  UPDATE public.user_profiles SET credits_remaining = credits_remaining - p_credits_to_deduct WHERE id = p_user_id;
  INSERT INTO public.usage_log (user_id, feature_used, credits_used) VALUES (p_user_id, p_feature_used, p_credits_to_deduct);
  RETURN TRUE;
END;
$function$;