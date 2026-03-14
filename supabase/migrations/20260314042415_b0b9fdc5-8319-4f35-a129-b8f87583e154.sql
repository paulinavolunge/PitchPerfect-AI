DROP POLICY IF EXISTS "System can manage rate limits" ON public.voice_rate_limits;

CREATE POLICY "Users can read own rate limits v2" ON public.voice_rate_limits FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages rate limits" ON public.voice_rate_limits FOR ALL USING (auth.role() = 'service_role');