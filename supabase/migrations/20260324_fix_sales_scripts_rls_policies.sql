-- Fix: All sales scripts including private notes were readable by every authenticated user
-- Fix: public_sales_scripts is a VIEW (not a table), so it inherits RLS from sales_scripts

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "sales_scripts_select_authenticated" ON sales_scripts;

-- Ensure RLS is enabled
ALTER TABLE sales_scripts ENABLE ROW LEVEL SECURITY;

-- Users can read their own scripts
CREATE POLICY "Users can read own scripts"
  ON sales_scripts FOR SELECT
  USING (user_id = auth.uid());

-- Users can read scripts marked as public
CREATE POLICY "Users can read public scripts"
  ON sales_scripts FOR SELECT
  USING (is_public = true);

-- Service role has full access
CREATE POLICY "Service role full access to sales_scripts"
  ON sales_scripts FOR ALL
  USING (auth.role() = 'service_role');
