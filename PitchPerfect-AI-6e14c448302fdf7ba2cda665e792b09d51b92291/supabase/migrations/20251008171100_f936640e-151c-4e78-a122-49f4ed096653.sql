-- Fix subscribers table security: Remove confusing policy and add explicit authentication requirement

-- Drop the confusing "Deny anonymous access" policy that doesn't properly restrict
DROP POLICY IF EXISTS "Deny anonymous access to subscribers" ON public.subscribers;

-- Add a restrictive policy that explicitly requires authentication for ALL operations
-- Restrictive policies must pass AND are combined with permissive policies using AND logic
CREATE POLICY "subscribers_require_authentication"
ON public.subscribers
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- This ensures that:
-- 1. Anonymous users (where auth.uid() IS NULL) are completely blocked from subscribers table
-- 2. Authenticated users must still pass the permissive policies (own data, admin access, etc.)
-- 3. The security model is explicit and clear