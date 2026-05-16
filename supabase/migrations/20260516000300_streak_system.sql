-- ── Streak system: freezes, events, timezone-aware RPC ──────────────────────

-- Add freeze tracking + timezone to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS streak_freezes_available INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_streak_freeze_used DATE,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

-- streak_events: immutable audit log for all streak lifecycle events
CREATE TABLE IF NOT EXISTS public.streak_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('extended', 'frozen', 'broken', 'milestone')),
  milestone_value INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS streak_events_user_type_idx
  ON public.streak_events (user_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS streak_events_milestone_idx
  ON public.streak_events (user_id, milestone_value)
  WHERE event_type = 'milestone';

ALTER TABLE public.streak_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streak_events_select_own" ON public.streak_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "streak_events_insert_own" ON public.streak_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── get_user_streak: timezone-aware consecutive-day counter ──────────────────
-- Replaces the earlier UTC-only version; also respects streak_events.frozen.
CREATE OR REPLACE FUNCTION public.get_user_streak(p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak     int  := 0;
  v_check_date date;
  v_found      bool;
  v_has_today  bool;
  v_tz         text;
BEGIN
  SELECT COALESCE(timezone, 'UTC') INTO v_tz
  FROM user_profiles WHERE id = p_user_id;

  -- Did they practice today in their local tz?
  SELECT EXISTS (
    SELECT 1 FROM practice_sessions
    WHERE user_id = p_user_id
      AND status  = 'scored'
      AND score  IS NOT NULL
      AND (created_at AT TIME ZONE v_tz)::date = (NOW() AT TIME ZONE v_tz)::date
  ) INTO v_has_today;

  v_check_date := CASE
    WHEN v_has_today THEN (NOW() AT TIME ZONE v_tz)::date
    ELSE (NOW() AT TIME ZONE v_tz)::date - 1
  END;

  LOOP
    -- Did they practice on this local date?
    SELECT EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE user_id = p_user_id
        AND status  = 'scored'
        AND score  IS NOT NULL
        AND (created_at AT TIME ZONE v_tz)::date = v_check_date
    ) INTO v_found;

    -- If not, was this day covered by a streak freeze?
    IF NOT v_found THEN
      SELECT EXISTS (
        SELECT 1 FROM streak_events
        WHERE user_id   = p_user_id
          AND event_type = 'frozen'
          AND (created_at AT TIME ZONE v_tz)::date = v_check_date
      ) INTO v_found;
    END IF;

    EXIT WHEN NOT v_found;
    v_streak     := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  RETURN v_streak;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_streak(uuid) TO authenticated;

-- ── use_streak_freeze: deduct one freeze, record the event ───────────────────
CREATE OR REPLACE FUNCTION public.use_streak_freeze(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available     int;
  v_tz            text;
  v_today         date;
  v_already_frozen bool;
BEGIN
  SELECT COALESCE(timezone, 'UTC') INTO v_tz FROM user_profiles WHERE id = p_user_id;
  v_today := (NOW() AT TIME ZONE v_tz)::date;

  SELECT streak_freezes_available INTO v_available FROM user_profiles WHERE id = p_user_id;
  IF v_available IS NULL OR v_available <= 0 THEN RETURN false; END IF;

  -- Idempotent: don't double-freeze the same local day
  SELECT EXISTS (
    SELECT 1 FROM streak_events
    WHERE user_id    = p_user_id
      AND event_type = 'frozen'
      AND (created_at AT TIME ZONE v_tz)::date = v_today
  ) INTO v_already_frozen;
  IF v_already_frozen THEN RETURN false; END IF;

  UPDATE user_profiles
     SET streak_freezes_available = streak_freezes_available - 1,
         last_streak_freeze_used  = v_today
   WHERE id = p_user_id;

  INSERT INTO streak_events (user_id, event_type)
  VALUES (p_user_id, 'frozen');

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_streak_freeze(uuid) TO authenticated;

-- ── pg_cron: schedule daily-streak-job at 00:05 UTC every day ────────────────
-- Run this manually once after applying the migration:
--
--   SELECT cron.schedule(
--     'daily-streak-job',
--     '5 0 * * *',
--     $$
--       SELECT net.http_post(
--         url    := '<SUPABASE_URL>/functions/v1/daily-streak-job',
--         headers := '{"Authorization": "Bearer <CRON_SECRET>"}',
--         body   := '{}'
--       );
--     $$
--   );
