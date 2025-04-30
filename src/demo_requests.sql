
-- Create the demo_requests table
CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies to secure the table
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view demo requests
CREATE POLICY "Allow admins to read demo requests" 
  ON demo_requests FOR SELECT 
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Allow anyone to insert demo requests (for the public demo request form)
CREATE POLICY "Allow anyone to insert demo requests" 
  ON demo_requests FOR INSERT 
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_demo_requests_timestamp
BEFORE UPDATE ON demo_requests
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
