-- Secure subscribers table: restrict service role policies to specific operations only
-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Remove overly broad policy that could allow blanket access
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscribers;

-- Service role: explicit, least-privilege per operation
CREATE POLICY "service_role_select_subscribers"
ON public.subscribers
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "service_role_insert_subscribers"
ON public.subscribers
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "service_role_update_subscribers"
ON public.subscribers
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_role_delete_subscribers"
ON public.subscribers
FOR DELETE
TO service_role
USING (true);
