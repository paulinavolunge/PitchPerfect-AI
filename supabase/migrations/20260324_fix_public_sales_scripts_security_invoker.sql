-- Fix: public_sales_scripts view was using SECURITY DEFINER (default),
-- which bypasses RLS on the underlying sales_scripts table.
-- Recreate with SECURITY INVOKER so RLS policies are enforced
-- based on the querying user, not the view creator.

CREATE OR REPLACE VIEW public_sales_scripts
WITH (security_invoker = true) AS
SELECT id, user_id, title, content, is_public, created_at, updated_at
FROM sales_scripts WHERE is_public = true;
