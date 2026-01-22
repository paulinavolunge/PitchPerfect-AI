
-- Create the demo_requests table with proper validation
CREATE TABLE IF NOT EXISTS public.demo_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL CHECK (length(full_name) > 0),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  company TEXT NOT NULL CHECK (length(company) > 0),
  phone TEXT,
  message TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies to secure the table
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view demo requests
CREATE POLICY "admins_read_demo_requests" 
  ON public.demo_requests FOR SELECT 
  USING (is_admin());

-- Allow admins to update demo requests
CREATE POLICY "admins_update_demo_requests" 
  ON public.demo_requests FOR UPDATE 
  USING (is_admin());

-- Allow anyone to insert demo requests (for the public demo request form)
CREATE POLICY "public_insert_demo_requests" 
  ON public.demo_requests FOR INSERT 
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_demo_requests_timestamp
BEFORE UPDATE ON public.demo_requests
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
