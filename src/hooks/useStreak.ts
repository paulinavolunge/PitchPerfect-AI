import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365] as const;
export type MilestoneValue = typeof STREAK_MILESTONES[number];

export interface StreakData {
  streak: number;
  atRisk: boolean;
  practicedToday: boolean;
  freezesAvailable: number;
  /** Milestone just reached for the first time — null if none. Clear with dismissMilestone(). */
  newMilestone: MilestoneValue | null;
  isLoading: boolean;
  useFreeze: () => Promise<boolean>;
  dismissMilestone: () => void;
  requestPushPermission: () => Promise<NotificationPermission | null>;
  refetch: () => void;
}

/** localStorage key for tracking which milestones a user has already seen. */
const milestoneKey = (userId: string) => `pp_seen_milestones_${userId}`;

function getSeenMilestones(userId: string): Set<number> {
  try {
    const raw = localStorage.getItem(milestoneKey(userId));
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

function markMilestoneSeen(userId: string, value: number) {
  try {
    const seen = getSeenMilestones(userId);
    seen.add(value);
    localStorage.setItem(milestoneKey(userId), JSON.stringify([...seen]));
  } catch {
    // non-critical
  }
}

/** Send a one-shot browser notification (foreground). No-op if permission not granted. */
function sendAtRiskNotification(streak: number) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification("Don't let your streak die. 90 seconds. Now.", {
      body: `Your ${streak}-day streak is at risk. One quick round keeps it alive.`,
      icon: '/favicon.ico',
      tag: 'streak-at-risk',  // deduplicates if called again
      requireInteraction: false,
    });
  } catch {
    // Safari may throw even with permission granted
  }
}

export function useStreak(): StreakData {
  const { user } = useAuth();
  const isMounted = useRef(true);
  const atRiskNotifiedRef = useRef(false);

  const [streak, setStreak] = useState(0);
  const [practicedToday, setPracticedToday] = useState(false);
  const [freezesAvailable, setFreezesAvailable] = useState(0);
  const [newMilestone, setNewMilestone] = useState<MilestoneValue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // "Today" in the user's local browser timezone (matches profile tz for most users)
      const now = new Date();
      const localDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const localDayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const [streakResult, todayResult, profileResult] = await Promise.all([
        supabase.rpc('get_user_streak', { p_user_id: user.id }),
        supabase
          .from('practice_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'scored')
          .not('score', 'is', null)
          .gte('created_at', localDayStart.toISOString())
          .lt('created_at', localDayEnd.toISOString()),
        supabase
          .from('user_profiles')
          .select('streak_freezes_available')
          .eq('id', user.id)
          .single(),
      ]);

      if (!isMounted.current) return;

      const currentStreak = (streakResult.data as number) ?? 0;
      const doneToday     = (todayResult.count ?? 0) > 0;
      const freezes       = profileResult.data?.streak_freezes_available ?? 0;

      setStreak(currentStreak);
      setPracticedToday(doneToday);
      setFreezesAvailable(freezes);

      // Milestone detection — check server for existing records to ensure once-per-lifetime
      if (STREAK_MILESTONES.includes(currentStreak as MilestoneValue)) {
        const seenLocally = getSeenMilestones(user.id);
        if (!seenLocally.has(currentStreak)) {
          // Cross-check against DB to prevent re-showing on a different device
          const { count: existingEvent } = await supabase
            .from('streak_events')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('event_type', 'milestone')
            .eq('milestone_value', currentStreak);

          if ((existingEvent ?? 0) === 0) {
            // First time hitting this milestone — record it and show modal
            await supabase.from('streak_events').insert({
              user_id: user.id,
              event_type: 'milestone',
              milestone_value: currentStreak,
            });
            markMilestoneSeen(user.id, currentStreak);
            if (isMounted.current) setNewMilestone(currentStreak as MilestoneValue);
          } else {
            // Already in DB — just mark locally so we stop querying
            markMilestoneSeen(user.id, currentStreak);
          }
        }
      }
    } catch {
      // non-critical
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    isMounted.current = true;
    fetch();
    return () => { isMounted.current = false; };
  }, [fetch]);

  // At-risk: streak > 0, not practiced today, local time past 18:00
  const now = new Date();
  const atRisk = streak > 0 && !practicedToday && now.getHours() >= 18;

  // Send push notification once per app session when status flips to at-risk
  useEffect(() => {
    if (atRisk && !atRiskNotifiedRef.current) {
      atRiskNotifiedRef.current = true;
      sendAtRiskNotification(streak);
    }
    if (!atRisk) {
      atRiskNotifiedRef.current = false;
    }
  }, [atRisk, streak]);

  const useFreeze = useCallback(async (): Promise<boolean> => {
    if (!user?.id || freezesAvailable <= 0) return false;
    try {
      const { data } = await supabase.rpc('use_streak_freeze', { p_user_id: user.id });
      if (data === true) {
        setFreezesAvailable((n) => Math.max(0, n - 1));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user?.id, freezesAvailable]);

  const dismissMilestone = useCallback(() => {
    setNewMilestone(null);
  }, []);

  const requestPushPermission = useCallback(async (): Promise<NotificationPermission | null> => {
    if (!('Notification' in window)) return null;
    if (Notification.permission === 'granted') return 'granted';
    try {
      return await Notification.requestPermission();
    } catch {
      return null;
    }
  }, []);

  return {
    streak,
    atRisk,
    practicedToday,
    freezesAvailable,
    newMilestone,
    isLoading,
    useFreeze,
    dismissMilestone,
    requestPushPermission,
    refetch: fetch,
  };
}
