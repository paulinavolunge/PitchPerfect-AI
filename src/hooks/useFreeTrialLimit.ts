import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Tier limits
const GUEST_ATTEMPT_LIMIT = 1;          // No account: 1 free demo
const FREE_ACCOUNT_MONTHLY_LIMIT = 3;   // Free account: 3 sessions/month
// Premium: unlimited (no limit check)

const LOCAL_STORAGE_KEY = 'pitchperfect_guest_practice_count';

export function useFreeTrialLimit() {
  const { user, isPremium } = useAuth();
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Determine which limit applies
  const currentLimit = user?.id ? FREE_ACCOUNT_MONTHLY_LIMIT : GUEST_ATTEMPT_LIMIT;

  const loadCount = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.id) {
        // For logged-in users: count practice sessions THIS MONTH only
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { count, error } = await supabase
          .from('practice_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('completed_at', startOfMonth);

        if (error) {
          console.error('Error fetching practice count:', error);
          setAttemptCount(0);
        } else {
          setAttemptCount(count ?? 0);
        }
      } else {
        // For guests: use localStorage
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

  // Premium users never hit limits
  const hasReachedLimit = !isPremium && attemptCount >= currentLimit;
  const remainingAttempts = isPremium ? Infinity : Math.max(0, currentLimit - attemptCount);

  // Helper: is this a guest (not logged in)?
  const isGuest = !user?.id;

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
    isGuest,
    currentLimit,
    GUEST_ATTEMPT_LIMIT,
    FREE_ACCOUNT_MONTHLY_LIMIT,
  };
}