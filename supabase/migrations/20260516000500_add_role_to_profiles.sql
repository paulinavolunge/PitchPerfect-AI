-- Add role and onboarding tracking to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Index for the gate query (IS NULL check)
CREATE INDEX IF NOT EXISTS user_profiles_role_null_idx
  ON public.user_profiles (id)
  WHERE role IS NULL;

COMMENT ON COLUMN public.user_profiles.role IS
  'Chosen sales role: sdr | ae | manager | founder. NULL = onboarding not yet completed.';
COMMENT ON COLUMN public.user_profiles.onboarding_completed_at IS
  'Timestamp when the role-selection screen was dismissed (pick or skip).';
