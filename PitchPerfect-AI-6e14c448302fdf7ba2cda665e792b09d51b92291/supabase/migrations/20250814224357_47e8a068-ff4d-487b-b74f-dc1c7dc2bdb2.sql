-- Fix subscribers table RLS policies to prevent anonymous access
-- and ensure proper user data isolation

-- Drop existing policies
DROP POLICY IF EXISTS "admins_view_all_subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create secure policies that only apply to authenticated users
-- Users can only view their own subscription data
CREATE POLICY "Users can view own subscription data" 
ON public.subscribers 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Users can only insert their own subscription data
CREATE POLICY "Users can insert own subscription data" 
ON public.subscribers 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own subscription data
CREATE POLICY "Users can update own subscription data" 
ON public.subscribers 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Admins can view all subscription data (read-only for admin oversight)
CREATE POLICY "Admins can view all subscription data" 
ON public.subscribers 
FOR SELECT 
TO authenticated 
USING (is_verified_admin());

-- Service role can manage all subscription data (for edge functions)
CREATE POLICY "Service role can manage subscriptions" 
ON public.subscribers 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Ensure no anonymous access by explicitly denying anon role if needed
-- (This is redundant since we only grant to authenticated/service_role, but adds clarity)
CREATE POLICY "Deny anonymous access to subscribers" 
ON public.subscribers 
FOR ALL 
TO anon 
USING (false) 
WITH CHECK (false);