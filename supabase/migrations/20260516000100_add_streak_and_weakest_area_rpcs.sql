-- RPC: consecutive UTC days ending today (or yesterday) with ≥1 scored round
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
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM practice_sessions
    WHERE user_id = p_user_id
      AND status  = 'scored'
      AND score  IS NOT NULL
      AND DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
  ) INTO v_has_today;

  -- Start from today if they already practiced today, else from yesterday
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
$$;

GRANT EXECUTE ON FUNCTION public.get_user_streak(uuid) TO authenticated;

-- RPC: scenario_type with lowest avg score over last 30 days (NULL if <3 scored rounds)
CREATE OR REPLACE FUNCTION public.get_user_weakest_area(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total    int;
  v_weakest  text;
BEGIN
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
$$;

GRANT EXECUTE ON FUNCTION public.get_user_weakest_area(uuid) TO authenticated;
