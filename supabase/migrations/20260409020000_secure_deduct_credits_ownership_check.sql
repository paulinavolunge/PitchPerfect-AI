-- Fix secure_deduct_credits_and_log_usage to verify caller ownership.
--
-- This function was previously created out-of-band (not in any migration
-- file). This migration brings it back under source control and adds an
-- explicit RAISE EXCEPTION check at the top — if the caller is trying
-- to deduct credits from an account they do not own, we fail loudly
-- instead of silently returning a JSON error.

CREATE OR REPLACE FUNCTION public.secure_deduct_credits_and_log_usage(
  p_user_id uuid,
  p_feature_used text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_credits INTEGER;
  credits_to_deduct INTEGER := 1;
BEGIN
  -- Caller ownership check — must be performed before any work.
  -- SECURITY DEFINER functions bypass RLS, so this is the only
  -- guard preventing one user from draining another user's credits.
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'unauthorized: cannot deduct credits for another user';
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT credits_remaining INTO current_credits
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF current_credits IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User profile not found',
      'available', 0,
      'required', credits_to_deduct
    );
  END IF;

  IF current_credits < credits_to_deduct THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'available', current_credits,
      'required', credits_to_deduct
    );
  END IF;

  UPDATE public.user_profiles
  SET credits_remaining = credits_remaining - credits_to_deduct,
      updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.usage_log (user_id, feature_used, credits_used)
  VALUES (p_user_id, p_feature_used, credits_to_deduct);

  PERFORM public.log_security_event(
    'credits_deducted',
    jsonb_build_object(
      'feature', p_feature_used,
      'credits_used', credits_to_deduct,
      'remaining_credits', current_credits - credits_to_deduct
    ),
    p_user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_used', credits_to_deduct,
    'remaining_credits', current_credits - credits_to_deduct
  );
END;
$function$;

-- Lock permissions — only authenticated clients should call this.
REVOKE ALL ON FUNCTION public.secure_deduct_credits_and_log_usage(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.secure_deduct_credits_and_log_usage(uuid, text) TO authenticated;
