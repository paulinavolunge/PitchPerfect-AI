
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

-- Create a table for tracking team performance and improvement
CREATE TABLE IF NOT EXISTS team_performance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES auth.users(id),
  raw_score INTEGER NOT NULL DEFAULT 0,
  previous_score INTEGER NOT NULL DEFAULT 0,
  improvement_delta INTEGER,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recorded_date)
);

-- Enable RLS on team_performance table
ALTER TABLE team_performance ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own performance data
CREATE POLICY "Allow users to read their own performance data"
  ON team_performance FOR SELECT
  USING (auth.uid() = user_id);

-- Allow managers to read their team's performance data
CREATE POLICY "Allow managers to read their team's performance data"
  ON team_performance FOR SELECT
  USING (auth.uid() = manager_id);

-- Allow users to insert their own performance data
CREATE POLICY "Allow users to insert their own performance data"
  ON team_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own performance data
CREATE POLICY "Allow users to update their own performance data"
  ON team_performance FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger to calculate improvement_delta
CREATE OR REPLACE FUNCTION calculate_improvement_delta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.previous_score = 0 THEN
    NEW.improvement_delta = 0;
  ELSE
    NEW.improvement_delta = ROUND(((NEW.raw_score - NEW.previous_score)::NUMERIC / NEW.previous_score::NUMERIC) * 100);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER calculate_team_performance_delta
BEFORE INSERT OR UPDATE ON team_performance
FOR EACH ROW
EXECUTE FUNCTION calculate_improvement_delta();
