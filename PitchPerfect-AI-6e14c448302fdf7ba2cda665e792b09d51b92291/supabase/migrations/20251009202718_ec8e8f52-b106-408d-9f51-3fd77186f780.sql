-- Fix Customer Email and Payment Data Exposure in subscribers table
-- Remove overly permissive service_role policies with 'true' condition
DROP POLICY IF EXISTS "service_role_delete_subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "service_role_insert_subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "service_role_update_subscribers" ON public.subscribers;

-- Service role will bypass RLS by default, no need for explicit policies
-- Only keep user-scoped and admin policies for authenticated users

-- Fix auth_rate_limits IP and Email Exposure
-- Remove overly permissive policy with 'true' condition
DROP POLICY IF EXISTS "System can manage auth rate limits" ON public.auth_rate_limits;

-- Create secure policy that only allows service_role operations
CREATE POLICY "service_role_manages_auth_rate_limits" 
ON public.auth_rate_limits FOR ALL
USING (auth.role() = 'service_role');

-- Add policy for users to view their own rate limit status only
CREATE POLICY "users_view_own_rate_limits" 
ON public.auth_rate_limits FOR SELECT
USING (auth.uid()::text = (
  SELECT id::text FROM auth.users WHERE email = auth_rate_limits.email
));