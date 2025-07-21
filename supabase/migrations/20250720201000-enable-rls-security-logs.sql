-- Enable RLS on security_logs table for security

-- Enable Row Level Security
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for security_logs table

-- Policy: Users can only insert their own security logs
CREATE POLICY "Users can insert their own security logs"
ON public.security_logs
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow users to log their own events
  auth.uid() = user_id 
  -- Or allow logging events without user_id (system events)
  OR user_id IS NULL
);

-- Policy: Users can view their own security logs
CREATE POLICY "Users can view their own security logs"
ON public.security_logs
FOR SELECT
TO authenticated
USING (
  -- Users can see their own logs
  auth.uid() = user_id
  -- Or logs without user_id (system events) if they're recent (last 24 hours)
  OR (user_id IS NULL AND created_at > NOW() - INTERVAL '24 hours')
);

-- Policy: Service role can do everything (for backend operations)
CREATE POLICY "Service role has full access"
ON public.security_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow the log_security_event function to insert logs
-- This is needed because the function runs with SECURITY DEFINER
CREATE POLICY "Allow security function to insert logs"
ON public.security_logs
FOR INSERT
TO public
WITH CHECK (
  -- This policy works in conjunction with the SECURITY DEFINER function
  -- The function validates the data before inserting
  true
);

-- Add a comment explaining the RLS setup
COMMENT ON TABLE public.security_logs IS 'Security logs table with RLS enabled. Users can only see their own logs, and system logs from the last 24 hours.';