
-- Allow trusted SECURITY DEFINER functions to bypass billing-field protection
CREATE OR REPLACE FUNCTION public.prevent_user_profile_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.role() = 'service_role'
     OR current_setting('app.trusted_billing_write', true) = 'on'
     OR public.is_verified_admin()
  THEN
    RETURN NEW;
  END IF;

  IF NEW.credits_remaining IS DISTINCT FROM OLD.credits_remaining
     OR NEW.is_premium IS DISTINCT FROM OLD.is_premium
     OR NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
     OR NEW.trial_used IS DISTINCT FROM OLD.trial_used
  THEN
    RAISE EXCEPTION 'Modification of billing or credit fields is not allowed';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.role() = 'service_role'
     OR current_setting('app.trusted_billing_write', true) = 'on'
     OR public.is_verified_admin()
  THEN
    RETURN NEW;
  END IF;
  NEW.credits_remaining := OLD.credits_remaining;
  NEW.is_premium := OLD.is_premium;
  NEW.subscription_plan := OLD.subscription_plan;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  RETURN NEW;
END;
$$;

-- Secure deduction: set trusted flag for the duration of the transaction
CREATE OR REPLACE FUNCTION public.secure_deduct_credits_and_log_usage(p_user_id uuid, p_feature_used text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_credits INTEGER;
  credits_to_deduct INTEGER := 1;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'unauthorized: cannot deduct credits for another user';
  END IF;

  PERFORM set_config('app.trusted_billing_write', 'on', true);

  SELECT credits_remaining INTO current_credits
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found',
                              'available', 0, 'required', credits_to_deduct);
  END IF;

  IF current_credits < credits_to_deduct THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits',
                              'available', current_credits, 'required', credits_to_deduct);
  END IF;

  UPDATE public.user_profiles
  SET credits_remaining = credits_remaining - credits_to_deduct,
      updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.usage_log (user_id, feature_used, credits_used)
  VALUES (p_user_id, p_feature_used, credits_to_deduct);

  PERFORM public.log_security_event(
    'credits_deducted',
    jsonb_build_object('feature', p_feature_used,
                       'credits_used', credits_to_deduct,
                       'remaining_credits', current_credits - credits_to_deduct),
    p_user_id
  );

  RETURN jsonb_build_object('success', true,
                            'credits_used', credits_to_deduct,
                            'remaining_credits', current_credits - credits_to_deduct);
END;
$$;

CREATE OR REPLACE FUNCTION public.atomic_deduct_credits(p_user_id uuid, p_feature_used text, p_credits_to_deduct integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: can only deduct own credits');
  END IF;

  PERFORM set_config('app.trusted_billing_write', 'on', true);

  SELECT credits_remaining INTO current_credits
  FROM public.user_profiles WHERE id = p_user_id FOR UPDATE;
  IF current_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found',
                              'available', 0, 'required', p_credits_to_deduct);
  END IF;
  IF current_credits < p_credits_to_deduct THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits',
                              'available', current_credits, 'required', p_credits_to_deduct);
  END IF;
  UPDATE public.user_profiles
  SET credits_remaining = credits_remaining - p_credits_to_deduct,
      updated_at = now()
  WHERE id = p_user_id;
  INSERT INTO public.usage_log (user_id, feature_used, credits_used)
  VALUES (p_user_id, p_feature_used, p_credits_to_deduct);
  PERFORM public.log_security_event(
    'credits_deducted_atomic',
    jsonb_build_object('feature', p_feature_used,
                       'credits_used', p_credits_to_deduct,
                       'remaining_credits', current_credits - p_credits_to_deduct),
    p_user_id
  );
  RETURN jsonb_build_object('success', true,
                            'credits_used', p_credits_to_deduct,
                            'remaining_credits', current_credits - p_credits_to_deduct);
END;
$$;
