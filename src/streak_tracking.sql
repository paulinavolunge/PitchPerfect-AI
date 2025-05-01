
-- Create a table for tracking user practice streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_count INTEGER NOT NULL DEFAULT 1,
  last_activity DATE NOT NULL DEFAULT CURRENT_DATE,
  best_streak INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies to secure the table
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Allow users to read only their own streak data
CREATE POLICY "Allow users to read their own streak data" 
  ON user_streaks FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow the service role and users to insert and update their own streak data
CREATE POLICY "Allow users to insert their own streak data" 
  ON user_streaks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own streak data" 
  ON user_streaks FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_user_streaks_timestamp
BEFORE UPDATE ON user_streaks
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
