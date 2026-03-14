import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const FREE_ATTEMPT_LIMIT = 1;
const LOCAL_STORAGE_KEY = 'pitchperfect_guest_practice_count';

export function useFreeTrialLimit() {
  const { user, isPremium } = useAuth();
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadCount = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const { count, error } = await supabase
          .from('practice_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching practice count:', error);
          setAttemptCount(0);
        } else {
          setAttemptCount(count ?? 0);
        }
      } else {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        setAttemptCount(stored ? parseInt(stored, 10) : 0);
      }
    } catch (err) {
      console.error('Error loading free trial count:', err);
      setAttemptCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCount();
  }, [loadCount]);

  const hasReachedLimit = !isPremium && attemptCount >= FREE_ATTEMPT_LIMIT;
  const remainingAttempts = Math.max(0, FREE_ATTEMPT_LIMIT - attemptCount);

  // Increment attempt: persists to Supabase for logged-in users, localStorage for guests
  const incrementAttempt = useCallback(async (practiceData?: {
    scenario_type?: string;
    difficulty?: string;
    industry?: string;
    duration_seconds?: number;
    score?: number | null;
    transcript?: any;
    feedback_data?: any;
  }) => {
    const newCount = attemptCount + 1;
    setAttemptCount(newCount);

    if (user?.id) {
      // Persist to Supabase
      try {
        const { error } = await supabase
          .from('practice_sessions')
          .insert({
            user_id: user.id,
            scenario_type: practiceData?.scenario_type ?? 'practice',
            difficulty: practiceData?.difficulty ?? 'beginner',
            industry: practiceData?.industry ?? 'general',
            duration_seconds: practiceData?.duration_seconds ?? 0,
            score: practiceData?.score ?? null,
            transcript: practiceData?.transcript ?? null,
            feedback_data: practiceData?.feedback_data ?? null,
            completed_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error persisting practice attempt:', error);
        }
      } catch (err) {
        console.error('Failed to persist practice attempt:', err);
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, newCount.toString());
    }
  }, [attemptCount, user?.id]);

  // Admin-only: reset the local counter for testing
  const resetAttempts = useCallback(async () => {
    setAttemptCount(0);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    // Note: does not delete practice_sessions rows — only resets local state
    // so admin can re-test the paywall flow
  }, []);

  // Reload count from source (useful after reset)
  const refreshCount = loadCount;

  return {
    attemptCount,
    hasReachedLimit,
    remainingAttempts,
    incrementAttempt,
    resetAttempts,
    refreshCount,
    loading,
    FREE_ATTEMPT_LIMIT,
  };
}
