
-- 1. Remove insecure user INSERT policies on audit/login tables (writes go through service_role only)
DROP POLICY IF EXISTS "users_insert_own_login_events" ON public.login_events;
DROP POLICY IF EXISTS "Users can insert their own login events" ON public.login_events;
DROP POLICY IF EXISTS "Users can insert their own login events" ON public.user_login_events;

-- 2. Harden the legacy deduct_credits_and_log_usage function: add caller check and revoke from authenticated
CREATE OR REPLACE FUNCTION public.deduct_credits_and_log_usage(p_user_id uuid, p_feature_used text, p_credits_to_deduct integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE current_credits integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'permission denied: cannot deduct credits for another user';
  END IF;
  IF p_credits_to_deduct IS NULL OR p_credits_to_deduct <= 0 THEN
    RAISE EXCEPTION 'invalid credit amount';
  END IF;
  SELECT credits INTO current_credits FROM public.user_credits
    WHERE user_id = p_user_id FOR UPDATE;
  IF current_credits IS NULL OR current_credits < p_credits_to_deduct THEN
    RETURN false;
  END IF;
  UPDATE public.user_credits SET credits = credits - p_credits_to_deduct,
    updated_at = now() WHERE user_id = p_user_id;
  INSERT INTO public.feature_usage_log (user_id, feature_used, credits_used)
    VALUES (p_user_id, p_feature_used, p_credits_to_deduct);
  RETURN true;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.deduct_credits_and_log_usage(uuid, text, integer) FROM PUBLIC, anon, authenticated;
