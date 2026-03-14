import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const FREE_ATTEMPT_LIMIT = 1;
const LOCAL_STORAGE_KEY = 'pitchperfect_guest_practice_count';

export function useFreeTrialLimit() {
  const { user, isPremium } = useAuth();
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Load attempt count
  useEffect(() => {
    const loadCount = async () => {
      setLoading(true);
      try {
        if (user?.id) {
          // Logged-in user: count from practice_sessions table
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
          // Guest user: read from localStorage
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          setAttemptCount(stored ? parseInt(stored, 10) : 0);
        }
      } catch (err) {
        console.error('Error loading free trial count:', err);
        setAttemptCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadCount();
  }, [user?.id]);

  const hasReachedLimit = !isPremium && attemptCount >= FREE_ATTEMPT_LIMIT;
  const remainingAttempts = Math.max(0, FREE_ATTEMPT_LIMIT - attemptCount);

  // Increment attempt count after a successful practice
  const incrementAttempt = useCallback(() => {
    const newCount = attemptCount + 1;
    setAttemptCount(newCount);

    if (!user?.id) {
      localStorage.setItem(LOCAL_STORAGE_KEY, newCount.toString());
    }
  }, [attemptCount, user?.id]);

  // Admin-only: reset the local counter for testing
  const resetAttempts = useCallback(() => {
    setAttemptCount(0);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  return {
    attemptCount,
    hasReachedLimit,
    remainingAttempts,
    incrementAttempt,
    resetAttempts,
    loading,
    FREE_ATTEMPT_LIMIT,
  };
}
