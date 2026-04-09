-- Extend the pending_credits ledger to also queue $29/mo Unlimited Pro
-- subscription activations purchased via static Stripe Payment Links
-- (which don't carry metadata.supabase_user_id).
--
-- New columns:
--   purchase_type        — 'pack' (one-time credit pack) or 'unlimited' (subscription)
--   stripe_customer_id   — captured for later cancellation handling
--   stripe_subscription_id — captured for later cancellation handling
--
-- The CHECK on credits is relaxed to >= 0 because unlimited rows store
-- credits = 0 (the activation is the unlimited flag, not a credit grant).

ALTER TABLE public.pending_credits
  DROP CONSTRAINT IF EXISTS pending_credits_credits_check;

ALTER TABLE public.pending_credits
  ADD CONSTRAINT pending_credits_credits_check CHECK (credits >= 0);

ALTER TABLE public.pending_credits
  ADD COLUMN IF NOT EXISTS purchase_type text NOT NULL DEFAULT 'pack'
    CHECK (purchase_type IN ('pack', 'unlimited'));

ALTER TABLE public.pending_credits
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

ALTER TABLE public.pending_credits
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- ─────────────────────────────────────────────────────────────
-- Replace the signup trigger so it handles both pack and
-- unlimited rows in a single pass.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_pending_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email             text;
  v_pack_credits      integer;
  v_has_unlimited     boolean;
  v_stripe_customer   text;
  v_stripe_sub        text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
  IF v_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Sum unconsumed pack credits for this email
  SELECT COALESCE(SUM(credits), 0) INTO v_pack_credits
  FROM public.pending_credits
  WHERE lower(email) = lower(v_email)
    AND consumed_at IS NULL
    AND purchase_type = 'pack';

  -- Find the most recent unconsumed unlimited subscription, if any
  SELECT TRUE,
         stripe_customer_id,
         stripe_subscription_id
  INTO v_has_unlimited, v_stripe_customer, v_stripe_sub
  FROM public.pending_credits
  WHERE lower(email) = lower(v_email)
    AND consumed_at IS NULL
    AND purchase_type = 'unlimited'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Apply pack credits
  IF v_pack_credits > 0 THEN
    UPDATE public.user_profiles
    SET credits_remaining = COALESCE(credits_remaining, 0) + v_pack_credits,
        updated_at = now()
    WHERE id = NEW.id;
  END IF;

  -- Apply unlimited subscription
  IF COALESCE(v_has_unlimited, false) THEN
    UPDATE public.user_profiles
    SET is_premium = true,
        subscription_plan = 'solo',
        stripe_customer_id = COALESCE(v_stripe_customer, stripe_customer_id),
        stripe_subscription_id = COALESCE(v_stripe_sub, stripe_subscription_id),
        updated_at = now()
    WHERE id = NEW.id;
  END IF;

  -- Mark every applied row consumed
  IF v_pack_credits > 0 OR COALESCE(v_has_unlimited, false) THEN
    UPDATE public.pending_credits
    SET consumed_at = now(),
        consumed_user_id = NEW.id
    WHERE lower(email) = lower(v_email)
      AND consumed_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_pending_credits() FROM public, anon, authenticated;
