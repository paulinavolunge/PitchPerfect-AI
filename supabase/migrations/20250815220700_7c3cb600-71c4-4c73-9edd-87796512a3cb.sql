-- Harden RLS for subscribers to prevent broad access and restrict policies to specific roles
-- Ensure RLS is enabled
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies we will recreate with explicit role scoping
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert own subscription data" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update own subscription data" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view own subscription data" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can view all subscription data" ON public.subscribers;

-- Service role: full access for backend processes only
CREATE POLICY "Service role can manage subscriptions"
ON public.subscribers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users: can insert their own row only
CREATE POLICY "Users can insert own subscription data"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users: can update their own row only
CREATE POLICY "Users can update own subscription data"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users: can view their own row only
CREATE POLICY "Users can view own subscription data"
ON public.subscribers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins: can view all rows (read-only)
CREATE POLICY "Admins can view all subscription data"
ON public.subscribers
FOR SELECT
TO authenticated
USING (is_verified_admin());