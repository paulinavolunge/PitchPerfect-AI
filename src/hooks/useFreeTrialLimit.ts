import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Tier limits
//
// Unauthenticated guests still get 1 free taste via the homepage cold call
// hook (ColdCallHook.tsx). That flow is gated separately by the
// `pp_cold_call_used` localStorage key and bypasses `incrementAttempt`
// via the `isColdCallHook` flag on GamifiedRoleplay, so it does NOT flow
// through this hook.
//
// Authenticated users no longer get any free monthly sessions — they must
// either have an active $29/mo subscription (`is_premium`) or credits
// purchased via a one-time pack. Credits are tracked on
// `user_profiles.credits_remaining` and decremented per session.
const GUEST_ATTEMPT_LIMIT = 1;          // No account: 1 free demo (legacy fallback)
const FREE_ACCOUNT_MONTHLY_LIMIT = 0;   // Authenticated: 0 free sessions — credits or subscription required
// Premium: unlimited (no limit check)

const LOCAL_STORAGE_KEY = 'pitchperfect_guest_practice_count';

export function useFreeTrialLimit() {
  const { user, isPremium, creditsRemaining, deductUserCredits, refreshSubscription } = useAuth();
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Determine which limit applies (kept for UI consumers that read currentLimit)
  const currentLimit = user?.id ? FREE_ACCOUNT_MONTHLY_LIMIT : GUEST_ATTEMPT_LIMIT;

  const loadCount = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.id) {
        // For logged-in users: count practice sessions THIS MONTH only (for analytics / display)
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

  // Gate logic:
  // - Premium ($29/mo subscription): always allowed
  // - Authenticated + credits_remaining > 0: allowed (credit pack decrements per session)
  // - Authenticated + no credits + no subscription: BLOCKED → ScorePaywall
  // - Guest: legacy localStorage counter (kept as a safety net — the real
  //   homepage cold call gate lives in ColdCallHook.tsx)
  const hasReachedLimit = (() => {
    if (isPremium) return false;
    if (user?.id) return (creditsRemaining ?? 0) <= 0;
    return attemptCount >= GUEST_ATTEMPT_LIMIT;
  })();

  const remainingAttempts = (() => {
    if (isPremium) return Infinity;
    if (user?.id) return Math.max(0, creditsRemaining ?? 0);
    return Math.max(0, GUEST_ATTEMPT_LIMIT - attemptCount);
  })();

  // Helper: is this a guest (not logged in)?
  const isGuest = !user?.id;

  // Increment attempt: persists to Supabase for logged-in users, localStorage for guests.
  // For authenticated non-premium users, also decrements credits_remaining.
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
      // Persist the session row for analytics / dashboard history
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

      // Decrement credits for credit-pack users (premium users don't consume credits)
      if (!isPremium) {
        try {
          const ok = await deductUserCredits('practice_session', 1);
          if (!ok) {
            console.warn('Credit deduction returned false — refreshing subscription to resync');
          }
          // Make sure AuthContext's creditsRemaining reflects the new value
          await refreshSubscription();
        } catch (err) {
          console.error('Failed to deduct practice credit:', err);
        }
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, newCount.toString());
    }
  }, [attemptCount, user?.id, isPremium, deductUserCredits, refreshSubscription]);

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
