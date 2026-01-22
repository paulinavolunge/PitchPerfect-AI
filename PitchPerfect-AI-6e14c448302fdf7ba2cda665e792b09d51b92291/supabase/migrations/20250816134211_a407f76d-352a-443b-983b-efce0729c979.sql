-- Remove overly broad SELECT policy on user_profiles to enforce least privilege
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop the policy that allowed all authenticated users to read profiles
DROP POLICY IF EXISTS "Authenticated users only" ON public.user_profiles;