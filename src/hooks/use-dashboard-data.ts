import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { toast } from "sonner";

// Zod schemas for data validation
const PracticeSessionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  created_at: z.string(),
  scenario_type: z.string(),
  difficulty: z.string(),
  score: z.number().nullable(),
  duration_seconds: z.number(),
});

const PitchRecordingSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  created_at: z.string(),
  title: z.string().nullable(),
  score: z.number().nullable(),
  duration: z.number().nullable(),
});

const UserProfileSchema = z.object({
  credits_remaining: z.number(),
  trial_used: z.boolean(),
});

type PracticeSession = z.infer<typeof PracticeSessionSchema>;
type PitchRecording = z.infer<typeof PitchRecordingSchema>;

export interface RecentSession {
  id: string;
  date: string;
  scenario: string;
  score: number | null;
  duration: number;
  type: 'practice' | 'pitch';
}

export interface AITip {
  id: string;
  title: string;
  description: string;
  type: 'tip' | 'script';
}

export interface DashboardData {
  profile: {
    credits: number;
    trialUsed: boolean;
  };
  recentSessions: RecentSession[];
  tips: AITip[];
  stats: {
    totalSessions: number;
    averageScore: number | null;
    hasData: boolean;
  };
}

export function useDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    profile: { credits: 0, trialUsed: false },
    recentSessions: [],
    tips: [],
    stats: { totalSessions: 0, averageScore: null, hasData: false },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      console.log('[dashboard] No user, skipping data fetch');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const abortController = new AbortController();

    try {
      console.log('[dashboard] Loading data for user:', user.id);

      // Parallel data fetching
      const [profileResult, sessionsResult, pitchesResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('credits_remaining, trial_used')
          .eq('id', user.id)
          .single(),
        supabase
          .from('practice_sessions')
          .select('id, user_id, created_at, scenario_type, difficulty, score, duration_seconds')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('pitch_recordings')
          .select('id, user_id, created_at, title, score, duration')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (abortController.signal.aborted) return;

      // Validate and process profile data
      let profile = { credits: 0, trialUsed: false };
      if (profileResult.data) {
        try {
          const validated = UserProfileSchema.parse(profileResult.data);
          profile = {
            credits: validated.credits_remaining,
            trialUsed: validated.trial_used,
          };
        } catch (e) {
          console.error('[dashboard] Profile validation error:', e);
        }
      }

      // Validate and process sessions
      const recentSessions: RecentSession[] = [];
      let totalScore = 0;
      let scoredCount = 0;

      if (sessionsResult.data) {
        sessionsResult.data.forEach((session) => {
          try {
            const validated = PracticeSessionSchema.parse(session);
            recentSessions.push({
              id: validated.id,
              date: validated.created_at,
              scenario: `${validated.scenario_type} (${validated.difficulty})`,
              score: validated.score,
              duration: validated.duration_seconds,
              type: 'practice',
            });
            if (validated.score !== null) {
              totalScore += validated.score;
              scoredCount++;
            }
          } catch (e) {
            console.warn('[dashboard] Session validation failed:', e);
          }
        });
      }

      if (pitchesResult.data) {
        pitchesResult.data.forEach((pitch) => {
          try {
            const validated = PitchRecordingSchema.parse(pitch);
            recentSessions.push({
              id: validated.id,
              date: validated.created_at,
              scenario: validated.title || 'Pitch Recording',
              score: validated.score,
              duration: validated.duration || 0,
              type: 'pitch',
            });
            if (validated.score !== null) {
              totalScore += validated.score;
              scoredCount++;
            }
          } catch (e) {
            console.warn('[dashboard] Pitch validation failed:', e);
          }
        });
      }

      // Sort combined sessions by date
      recentSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Static AI tips (could be fetched from DB later)
      const tips: AITip[] = [
        {
          id: '1',
          title: 'Use Benefit-Focused Language',
          description: 'Frame features in terms of customer benefits using phrases like "which means that you can..."',
          type: 'tip',
        },
        {
          id: '2',
          title: 'Elevator Pitch Template',
          description: 'Our [product] helps [target audience] to [solve problem] by [unique approach] unlike [alternative].',
          type: 'script',
        },
        {
          id: '3',
          title: 'Handle Objections with LAER',
          description: 'Listen, Acknowledge, Explore, Respond. This framework helps you address concerns systematically.',
          type: 'tip',
        },
      ];

      setData({
        profile,
        recentSessions: recentSessions.slice(0, 5),
        tips,
        stats: {
          totalSessions: recentSessions.length,
          averageScore: scoredCount > 0 ? Math.round(totalScore / scoredCount) : null,
          hasData: recentSessions.length > 0,
        },
      });

      console.log('[dashboard] Data loaded successfully:', {
        sessions: recentSessions.length,
        credits: profile.credits,
      });
    } catch (err) {
      console.error('[dashboard] Error loading data:', err);
      const errorMessage = 'Couldn\'t load dashboard. Please retry.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }

    return () => abortController.abort();
  }, [user?.id]);

  const refetch = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
