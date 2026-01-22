-- Update user_roles RLS policy to use is_verified_admin() function
-- This avoids recursive RLS checks

DROP POLICY IF EXISTS "admins_manage_roles" ON public.user_roles;

CREATE POLICY "admins_manage_roles"
ON public.user_roles
FOR ALL
USING (public.is_verified_admin())
WITH CHECK (public.is_verified_admin());