-- RLS cannot filter columns, so we use a view for public access.
-- 1) Tighten the base table: only owners and admins can SELECT directly
DROP POLICY IF EXISTS "sales_scripts_select_secure" ON public.sales_scripts;

CREATE POLICY "sales_scripts_select_owner_admin"
ON public.sales_scripts
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_verified_admin());

-- 2) Create a secure view that excludes private_notes for public scripts
CREATE OR REPLACE VIEW public.public_sales_scripts
WITH (security_invoker = false)
AS
SELECT id, user_id, title, content, is_public, created_at, updated_at
FROM public.sales_scripts
WHERE is_public = true;

-- 3) Grant read access on the view to authenticated and anon roles
GRANT SELECT ON public.public_sales_scripts TO authenticated;
GRANT SELECT ON public.public_sales_scripts TO anon;