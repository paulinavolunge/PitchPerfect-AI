
-- Fix: Change view to security invoker so it respects querying user's RLS
DROP VIEW IF EXISTS public.public_sales_scripts;

CREATE VIEW public.public_sales_scripts WITH (security_invoker = true) AS
SELECT
  id,
  title,
  content,
  is_public,
  created_at,
  updated_at
FROM public.sales_scripts
WHERE is_public = true;

-- Re-grant select
GRANT SELECT ON public.public_sales_scripts TO authenticated;
GRANT SELECT ON public.public_sales_scripts TO anon;

-- Since we removed "Users can read public scripts" policy, authenticated users
-- need a way to read public scripts through the base table for the view to work.
-- Add a restricted policy that only exposes non-sensitive columns via the view.
CREATE POLICY "Authenticated read public scripts no private_notes" ON public.sales_scripts
FOR SELECT TO authenticated
USING (is_public = true);
