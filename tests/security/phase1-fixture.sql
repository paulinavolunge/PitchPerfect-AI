-- TEST ONLY: minimal reproduction of reported policies, never a production migration.
CREATE TABLE public.voice_rate_limits(id uuid primary key, user_id uuid not null, request_count integer default 0);
CREATE TABLE public.security_logs(id bigint generated always as identity primary key, user_id uuid, event_type text not null, event_details jsonb);
ALTER TABLE public.voice_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.voice_rate_limits,public.security_logs TO anon,authenticated,service_role;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO anon,authenticated,service_role;
CREATE FUNCTION public.is_verified_admin() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT auth.uid() = '33333333-3333-4333-8333-333333333333'::uuid $$;
CREATE POLICY "Authenticated users only" ON public.voice_rate_limits FOR SELECT TO public USING (auth.role()='authenticated');
CREATE POLICY "Users can view own rate limits" ON public.voice_rate_limits FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.is_verified_admin());
CREATE POLICY "Service role manages rate limits" ON public.voice_rate_limits FOR ALL TO service_role USING(true);
CREATE POLICY "Allow security function to insert logs" ON public.security_logs FOR INSERT TO public WITH CHECK(true);
CREATE POLICY "users_insert_own_security_logs" ON public.security_logs FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE FUNCTION public.log_security_event(p_event_type text,p_event_details jsonb DEFAULT '{}'::jsonb,p_user_id uuid DEFAULT NULL) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$ INSERT INTO public.security_logs(event_type,event_details,user_id) VALUES(p_event_type,p_event_details,p_user_id) $$;
INSERT INTO public.voice_rate_limits(id,user_id) VALUES
('11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
('22222222-2222-4222-8222-222222222222','22222222-2222-4222-8222-222222222222');
