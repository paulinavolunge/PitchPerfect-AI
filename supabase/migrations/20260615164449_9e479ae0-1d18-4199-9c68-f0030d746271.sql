
-- Remove client write policies on subscribers (only service_role/webhooks should write)
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscribers;

-- Lock down streak SECURITY DEFINER RPCs with ownership checks
CREATE OR REPLACE FUNCTION public.get_user_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_streak     int  := 0;
  v_check_date date;
  v_found      bool;
  v_has_today  bool;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM practice_sessions
    WHERE user_id = p_user_id
      AND status  = 'scored'
      AND score  IS NOT NULL
      AND DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
  ) INTO v_has_today;

  v_check_date := CASE WHEN v_has_today THEN CURRENT_DATE ELSE CURRENT_DATE - 1 END;

  LOOP
    SELECT EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE user_id = p_user_id
        AND status  = 'scored'
        AND score  IS NOT NULL
        AND DATE(created_at AT TIME ZONE 'UTC') = v_check_date
    ) INTO v_found;

    EXIT WHEN NOT v_found;
    v_streak     := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  RETURN v_streak;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_weakest_area(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total    int;
  v_weakest  text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM practice_sessions
  WHERE user_id    = p_user_id
    AND status     = 'scored'
    AND score     IS NOT NULL
    AND created_at >= NOW() - INTERVAL '30 days';

  IF v_total < 3 THEN
    RETURN NULL;
  END IF;

  SELECT scenario_type INTO v_weakest
  FROM practice_sessions
  WHERE user_id    = p_user_id
    AND status     = 'scored'
    AND score     IS NOT NULL
    AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY scenario_type
  ORDER BY AVG(score) ASC
  LIMIT 1;

  RETURN v_weakest;
END;
$function$;

-- Guard use_streak_freeze if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'use_streak_freeze'
  ) THEN
    EXECUTE $f$
      CREATE OR REPLACE FUNCTION public.use_streak_freeze(p_user_id uuid)
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'public'
      AS $body$
      DECLARE
        v_available int;
      BEGIN
        IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
          RAISE EXCEPTION 'permission denied: can only use your own streak freeze';
        END IF;

        SELECT streak_freezes_available INTO v_available
        FROM public.user_profiles WHERE id = p_user_id FOR UPDATE;

        IF v_available IS NULL OR v_available <= 0 THEN
          RETURN false;
        END IF;

        UPDATE public.user_profiles
        SET streak_freezes_available = streak_freezes_available - 1,
            updated_at = now()
        WHERE id = p_user_id;

        BEGIN
          INSERT INTO public.streak_events (user_id, event_type)
          VALUES (p_user_id, 'frozen');
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;

        RETURN true;
      END;
      $body$;
    $f$;
  END IF;
END$$;
