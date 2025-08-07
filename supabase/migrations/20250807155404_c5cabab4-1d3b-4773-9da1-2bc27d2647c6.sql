-- Fix user_login_events policies that may already exist

-- Safely drop and recreate user_login_events policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own login events" ON public.user_login_events;
DROP POLICY IF EXISTS "Users can insert their own login events" ON public.user_login_events;  
DROP POLICY IF EXISTS "Admins can view all login events" ON public.user_login_events;

-- Recreate the policies properly
CREATE POLICY "Users can view their own login events" 
ON public.user_login_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own login events" 
ON public.user_login_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all login events" 
ON public.user_login_events 
FOR SELECT 
USING (is_verified_admin());