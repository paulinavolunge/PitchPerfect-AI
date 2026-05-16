-- Add reason column for incomplete/failed round classification
ALTER TABLE public.practice_sessions
  ADD COLUMN IF NOT EXISTS reason TEXT;

-- Trigger function: classify new rounds at INSERT time
-- Only fires when caller leaves status at default 'scored'.
-- Callers that explicitly set 'recording' or 'processing' own the lifecycle.
CREATE OR REPLACE FUNCTION public.set_round_status_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'scored' THEN
    IF NEW.duration_seconds < 10 THEN
      NEW.status := 'incomplete';
      NEW.reason := 'too_short';
    ELSIF NEW.transcript IS NULL OR length(trim(NEW.transcript::text)) < 20 THEN
      NEW.status := 'incomplete';
      NEW.reason := 'no_speech_detected';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS round_status_on_insert ON public.practice_sessions;
CREATE TRIGGER round_status_on_insert
  BEFORE INSERT ON public.practice_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_round_status_on_insert();
