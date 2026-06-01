
DROP POLICY IF EXISTS "admins_only_view_activity" ON public.admin_activity_log;
CREATE POLICY "admins_only_view_activity"
ON public.admin_activity_log
FOR SELECT
TO authenticated
USING (public.is_verified_admin());
