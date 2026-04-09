-- Pending credits ledger for one-time Stripe credit pack purchases made
-- before the buyer has a Supabase account. Also serves as an idempotency
-- ledger for the stripe-webhook edge function (unique on stripe_session_id).
--
-- When the buyer later signs up, the after-insert trigger on user_profiles
-- drains any unconsumed pending_credits for their email into
-- user_profiles.credits_remaining.

CREATE TABLE IF NOT EXISTS public.pending_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  credits integer NOT NULL CHECK (credits > 0),
  stripe_session_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  consumed_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_credits_email_unconsumed
  ON public.pending_credits (email)
  WHERE consumed_at IS NULL;

-- Lock the table down. Only the service role (edge functions / triggers)
-- should ever read or write it — never the client.
ALTER TABLE public.pending_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_pending_credits" ON public.pending_credits;
CREATE POLICY "service_role_all_pending_credits"
  ON public.pending_credits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- get_user_id_by_email: service-role-only lookup into auth.users
-- by email. The Supabase JS client can't query the auth schema
-- directly, so the stripe-webhook edge function calls this RPC
-- to resolve an email → user id after a Stripe checkout.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;

-- ─────────────────────────────────────────────────────────────
-- handle_pending_credits: after a user_profiles row is created
-- (e.g. on signup), look up any unconsumed pending_credits for
-- the user's auth email, add them to credits_remaining, and
-- mark the pending rows consumed.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_pending_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_total integer;
BEGIN
  -- Resolve email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
  IF v_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Sum unconsumed credits for this email
  SELECT COALESCE(SUM(credits), 0) INTO v_total
  FROM public.pending_credits
  WHERE lower(email) = lower(v_email)
    AND consumed_at IS NULL;

  IF v_total > 0 THEN
    -- Grant them
    UPDATE public.user_profiles
    SET credits_remaining = COALESCE(credits_remaining, 0) + v_total,
        updated_at = now()
    WHERE id = NEW.id;

    -- Mark as consumed
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

DROP TRIGGER IF EXISTS grant_pending_credits_after_profile_insert ON public.user_profiles;
CREATE TRIGGER grant_pending_credits_after_profile_insert
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_pending_credits();
