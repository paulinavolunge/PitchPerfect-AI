
-- 1. Restrict auth_rate_limits SELECT to service_role only (remove email enumeration risk)
DROP POLICY IF EXISTS "users_view_own_rate_limits" ON public.auth_rate_limits;

-- 2. Add INSERT/UPDATE/DELETE policies for sales_scripts (users manage own)
CREATE POLICY "Users can insert own scripts"
ON public.sales_scripts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own scripts"
ON public.sales_scripts FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own scripts"
ON public.sales_scripts FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 3. Remove redundant privilege escalation policy (covered by admins_manage_roles)
DROP POLICY IF EXISTS "prevent_self_privilege_escalation" ON public.user_roles;

-- 4. Restrict voice_rate_limits SELECT policy to authenticated role only (not anon)
DROP POLICY IF EXISTS "Users can view own rate limits" ON public.voice_rate_limits;
CREATE POLICY "Users can view own rate limits"
ON public.voice_rate_limits FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR is_verified_admin());

-- 5. Prevent users from updating sensitive billing/credit fields on user_profiles
-- Replace the broad UPDATE policy with a trigger that blocks changes to sensitive columns
DROP POLICY IF EXISTS "Users can update own non-sensitive profile fields" ON public.user_profiles;

CREATE POLICY "Users can update own non-sensitive profile fields"
ON public.user_profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.prevent_user_profile_sensitive_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role to change anything
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- For end users, block changes to sensitive billing/credit fields
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

DROP TRIGGER IF EXISTS trg_prevent_user_profile_sensitive_changes ON public.user_profiles;
CREATE TRIGGER trg_prevent_user_profile_sensitive_changes
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_profile_sensitive_changes();
