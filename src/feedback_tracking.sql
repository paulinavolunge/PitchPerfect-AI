
-- Create user_roles table first (required for admin functions)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can manage roles
CREATE POLICY "admins_manage_roles" ON public.user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Users can read their own roles
CREATE POLICY "users_read_own_roles" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

-- Table to store user feedback for AI sessions
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('roleplay', 'practice', 'demo')),
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Default RLS policy: Users can only insert their own feedback
CREATE POLICY "users_insert_own_feedback"
  ON public.user_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to select their own feedback
CREATE POLICY "users_view_own_feedback"
  ON public.user_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Admins can view all feedback
CREATE POLICY "admins_view_all_feedback"
  ON public.user_feedback
  FOR SELECT
  USING (is_admin());

-- Add update trigger
CREATE TRIGGER update_user_feedback_timestamp
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Create a view for analytics (with security barrier)
CREATE OR REPLACE VIEW feedback_analytics WITH (security_barrier) AS
SELECT
  date_trunc('day', created_at) as day,
  feedback_type,
  count(*) as total_feedback,
  sum(case when is_helpful then 1 else 0 end) as helpful_count,
  sum(case when not is_helpful then 1 else 0 end) as unhelpful_count,
  round((sum(case when is_helpful then 1 else 0 end)::float / count(*)::float) * 100, 2) as helpful_percentage
FROM public.user_feedback
WHERE auth.uid() IS NOT NULL -- Ensures only authenticated users can access
GROUP BY date_trunc('day', created_at), feedback_type
ORDER BY day DESC, feedback_type;
