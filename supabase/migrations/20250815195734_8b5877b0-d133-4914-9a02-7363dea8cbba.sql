-- Tighten subscribers UPDATE policy to include WITH CHECK to prevent changing user_id or cross-tenant writes
DROP POLICY IF EXISTS "Users can update own subscription data" ON public.subscribers;

CREATE POLICY "Users can update own subscription data"
ON public.subscribers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
