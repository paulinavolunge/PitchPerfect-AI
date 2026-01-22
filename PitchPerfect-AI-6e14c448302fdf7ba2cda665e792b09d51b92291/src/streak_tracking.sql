
-- Create a table for tracking user practice streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_count INTEGER NOT NULL DEFAULT 1 CHECK (streak_count >= 0),
  last_activity DATE NOT NULL DEFAULT CURRENT_DATE,
  best_streak INTEGER NOT NULL DEFAULT 1 CHECK (best_streak >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies to secure the table
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Allow users to read only their own streak data
CREATE POLICY "users_read_own_streaks" 
  ON public.user_streaks FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert and update their own streak data
CREATE POLICY "users_insert_own_streaks" 
  ON public.user_streaks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_streaks" 
  ON public.user_streaks FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_streaks_timestamp
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Create a table for tracking team performance and improvement
CREATE TABLE IF NOT EXISTS public.team_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  raw_score INTEGER NOT NULL DEFAULT 0 CHECK (raw_score >= 0 AND raw_score <= 100),
  previous_score INTEGER NOT NULL DEFAULT 0 CHECK (previous_score >= 0 AND previous_score <= 100),
  improvement_delta INTEGER,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recorded_date)
);

-- Enable RLS on team_performance table
ALTER TABLE public.team_performance ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own performance data and managers to read their team's data
CREATE POLICY "users_read_own_team_performance"
  ON public.team_performance FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = manager_id);

-- Allow users to insert their own performance data
CREATE POLICY "users_insert_own_team_performance"
  ON public.team_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own performance data
CREATE POLICY "users_update_own_team_performance"
  ON public.team_performance FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger to calculate improvement_delta and update streaks
CREATE OR REPLACE FUNCTION calculate_improvement_delta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.previous_score = 0 OR NEW.previous_score IS NULL THEN
    NEW.improvement_delta = 0;
  ELSE
    NEW.improvement_delta = ROUND(
      ((NEW.raw_score - NEW.previous_score)::NUMERIC / NEW.previous_score::NUMERIC) * 100
    );
  END IF;
  
  -- Update streak if this is a good performance (70+ score)
  IF NEW.raw_score >= 70 THEN
    INSERT INTO public.user_streaks (user_id, streak_count, last_activity, best_streak)
    VALUES (NEW.user_id, 1, CURRENT_DATE, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      streak_count = CASE 
        WHEN user_streaks.last_activity = CURRENT_DATE - INTERVAL '1 day' 
        THEN user_streaks.streak_count + 1
        WHEN user_streaks.last_activity = CURRENT_DATE
        THEN user_streaks.streak_count
        ELSE 1
      END,
      best_streak = GREATEST(user_streaks.best_streak, 
        CASE 
          WHEN user_streaks.last_activity = CURRENT_DATE - INTERVAL '1 day' 
          THEN user_streaks.streak_count + 1
          ELSE 1
        END
      ),
      last_activity = CURRENT_DATE,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_team_performance_delta
BEFORE INSERT OR UPDATE ON public.team_performance
FOR EACH ROW
EXECUTE FUNCTION calculate_improvement_delta();

-- Add update trigger
CREATE TRIGGER update_team_performance_timestamp
BEFORE UPDATE ON public.team_performance
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
