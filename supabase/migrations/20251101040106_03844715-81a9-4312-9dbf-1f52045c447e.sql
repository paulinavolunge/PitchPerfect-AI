-- Fix security_logs RLS policies to prevent client-side tampering
-- Remove policies that allow regular users to write to security logs

-- Drop the problematic policies that allow users to insert their own logs
DROP POLICY IF EXISTS "users_insert_own_security_logs" ON public.security_logs;
DROP POLICY IF EXISTS "Authenticated users only" ON public.security_logs;

-- Keep only service role and admin access policies
-- The "Service role has full access" policy already exists and is correct
-- The "admins_read_all_security_logs" policy already exists and is correct

-- Ensure only service role can insert security logs
CREATE POLICY "service_role_only_insert" ON public.security_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add comment explaining the security model
COMMENT ON TABLE public.security_logs IS 'Security audit logs - only writable by service role (Edge Functions), readable by admins. Client-side logging is not permitted to prevent audit trail tampering.';