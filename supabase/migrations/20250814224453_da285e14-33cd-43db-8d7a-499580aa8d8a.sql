-- Fix pitch_recordings table security vulnerability
-- Remove the overly permissive "Authenticated users only" policy that allows 
-- any authenticated user to access all recordings

-- Drop the dangerous policy that grants access to all authenticated users
DROP POLICY IF EXISTS "Authenticated users only" ON public.pitch_recordings;

-- Verify the secure policies are properly configured
-- The existing policies should be sufficient:
-- - pitch_recordings_select_secure: Users can only see their own recordings OR public ones OR admin access
-- - pitch_recordings_insert_secure: Users can only insert their own recordings  
-- - pitch_recordings_update_secure: Users can only update their own recordings OR admin access
-- - pitch_recordings_delete_secure: Users can only delete their own recordings OR admin access

-- Add an explicit policy to deny anonymous access for extra security
CREATE POLICY "Deny anonymous access to pitch recordings" 
ON public.pitch_recordings 
FOR ALL 
TO anon 
USING (false) 
WITH CHECK (false);

-- Log this security fix
DO $$
BEGIN
  PERFORM public.log_security_event(
    'security_vulnerability_fixed',
    jsonb_build_object(
      'table', 'pitch_recordings',
      'issue', 'removed_overly_permissive_authenticated_policy',
      'description', 'Removed policy that allowed any authenticated user to access all recordings'
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Continue if logging fails
  NULL;
END $$;