CREATE TABLE IF NOT EXISTS public.upgrade_prompt_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger      TEXT        NOT NULL,   -- e.g. 'round_3_improvement'
  shown_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  converted    BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS upgrade_prompt_events_user_trigger_idx
  ON public.upgrade_prompt_events (user_id, trigger, shown_at DESC);

ALTER TABLE public.upgrade_prompt_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "upgrade_events_select_own" ON public.upgrade_prompt_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "upgrade_events_insert_own" ON public.upgrade_prompt_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "upgrade_events_update_own" ON public.upgrade_prompt_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
