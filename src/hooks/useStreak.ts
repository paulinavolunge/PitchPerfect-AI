import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface StreakData {
  streak: number;
  atRisk: boolean; // streak > 0 but user hasn't practiced today
}

export function useStreak() {
  const { user } = useAuth();
  const isMounted = useRef(true);
  const [data, setData] = useState<StreakData>({ streak: 0, atRisk: false });
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [streakResult, todayResult] = await Promise.all([
        supabase.rpc("get_user_streak", { p_user_id: user.id }),
        supabase
          .from("practice_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "scored")
          .not("score", "is", null)
          .gte("created_at", new Date().toISOString().slice(0, 10)), // today UTC
      ]);

      if (!isMounted.current) return;
      const streak = (streakResult.data as number) ?? 0;
      const practicedToday = (todayResult.count ?? 0) > 0;
      setData({ streak, atRisk: streak > 0 && !practicedToday });
    } catch {
      // non-critical — leave defaults
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    isMounted.current = true;
    fetch();
    return () => { isMounted.current = false; };
  }, [fetch]);

  return { ...data, isLoading, refetch: fetch };
}
