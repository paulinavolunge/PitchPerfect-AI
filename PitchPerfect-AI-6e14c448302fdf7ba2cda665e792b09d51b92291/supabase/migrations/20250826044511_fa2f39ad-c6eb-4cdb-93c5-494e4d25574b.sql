-- Stricter access controls for subscribers: remove broad service_role SELECT
-- Keep per-operation service_role access only where necessary (INSERT/UPDATE/DELETE)

-- Ensure RLS is enabled
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Remove service role SELECT capability to minimize data exposure surface
DROP POLICY IF EXISTS "service_role_select_subscribers" ON public.subscribers;

-- Notes:
-- - Existing owner-only and admin SELECT policies remain intact
-- - service_role still permitted for INSERT/UPDATE/DELETE via existing policies
-- - No schema changes; minimizes risk to existing functionality
