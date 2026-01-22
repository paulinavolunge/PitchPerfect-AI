-- Remove overly permissive RLS policies on subscribers table that expose customer data

-- Drop the broad "Authenticated users only" SELECT policy
DROP POLICY IF EXISTS "Authenticated users only" ON public.subscribers;

-- Drop the broad "subscribers_require_authentication" ALL policy
DROP POLICY IF EXISTS "subscribers_require_authentication" ON public.subscribers;

-- The table still has proper access control through these existing policies:
-- 1. "Users can view own subscription data" - users can see their own data
-- 2. "Admins can view all subscription data" - admins can see all data
-- 3. Service role policies for backend operations