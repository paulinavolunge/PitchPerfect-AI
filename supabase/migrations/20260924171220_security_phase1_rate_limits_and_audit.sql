-- Preserve the existing owner/admin SELECT and service management policies.
DROP POLICY IF EXISTS "Authenticated users only" ON public.voice_rate_limits;

-- Browser clients must not author trusted audit records, even for themselves.
DROP POLICY IF EXISTS "Allow security function to insert logs" ON public.security_logs;
DROP POLICY IF EXISTS "users_insert_own_security_logs" ON public.security_logs;
DROP POLICY IF EXISTS "Users can insert their own security logs" ON public.security_logs;
REVOKE INSERT ON public.security_logs FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.security_logs TO service_role;

-- The old definer RPC is a second write boundary. Nested trusted SQL functions
-- still execute it as their owner; service-role jobs retain direct access.
REVOKE EXECUTE ON FUNCTION public.log_security_event(text,jsonb,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text,jsonb,uuid) TO service_role;

-- Preserve browser diagnostics without representing their claims as audit facts.
CREATE OR REPLACE FUNCTION public.report_client_security_event(
  p_event_type text, p_event_details jsonb DEFAULT '{}'::jsonb,
  p_user_id uuid DEFAULT NULL::uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  caller uuid := auth.uid();
BEGIN
  IF caller IS NULL OR (p_user_id IS NOT NULL AND p_user_id <> caller) THEN
    RAISE EXCEPTION 'Invalid client report identity' USING ERRCODE = '42501';
  END IF;
  IF p_event_type IS NULL OR length(p_event_type) NOT BETWEEN 1 AND 100
     OR p_event_details IS NULL OR jsonb_typeof(p_event_details) <> 'object'
     OR octet_length(p_event_details::text) > 5120 THEN
    RAISE EXCEPTION 'Invalid client report';
  END IF;
  INSERT INTO public.security_logs(event_type,event_details,user_id)
  VALUES ('client_report', jsonb_build_object('source','untrusted_client',
    'reported_event_type',p_event_type,'reported_details',p_event_details), caller);
END;
$$;
REVOKE ALL ON FUNCTION public.report_client_security_event(text,jsonb,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_client_security_event(text,jsonb,uuid) TO authenticated;
