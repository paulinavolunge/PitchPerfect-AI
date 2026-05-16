-- Add status column to practice_sessions (the "rounds" table)
ALTER TABLE public.practice_sessions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scored'
    CHECK (status IN ('recording', 'processing', 'scored', 'incomplete', 'failed'));

-- Backfill: mark rounds with no score or zero duration as incomplete
UPDATE public.practice_sessions
  SET status = 'incomplete'
  WHERE score IS NULL OR duration_seconds = 0;

-- Index for efficient per-user scored-round lookups
CREATE INDEX IF NOT EXISTS rounds_user_status_created_idx
  ON public.practice_sessions (user_id, status, created_at DESC);
