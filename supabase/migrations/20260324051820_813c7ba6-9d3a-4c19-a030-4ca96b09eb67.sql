
-- Fix 1: Drop the policy that exposes private_notes to all users reading public scripts
DROP POLICY IF EXISTS "Users can read public scripts" ON public.sales_scripts;

-- Fix 2: Recreate the public_sales_scripts view as a security barrier view
-- This excludes private_notes and user_id, and only shows public scripts
DROP VIEW IF EXISTS public.public_sales_scripts;

CREATE VIEW public.public_sales_scripts WITH (security_barrier = true) AS
SELECT
  id,
  title,
  content,
  is_public,
  created_at,
  updated_at
FROM public.sales_scripts
WHERE is_public = true;

-- Grant select on the view to authenticated and anon roles
GRANT SELECT ON public.public_sales_scripts TO authenticated;
GRANT SELECT ON public.public_sales_scripts TO anon;
