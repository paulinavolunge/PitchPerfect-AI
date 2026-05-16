import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface RoundStats {
  avgScore: number | null;
  scoredCount: number;
  trend: number | null; // positive = improved, negative = declined, null = insufficient data
  sparkline: number[]; // last 14 scored round scores, oldest-first
}

export function useRoundStats() {
  const { user } = useAuth();
  const isMountedRef = useRef(true);
  const [stats, setStats] = useState<RoundStats>({
    avgScore: null,
    scoredCount: 0,
    trend: null,
    sparkline: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch the 14 most recent scored rounds for trend + sparkline
      const { data, error: queryError } = await supabase
        .from("practice_sessions")
        .select("score, created_at")
        .eq("user_id", user.id)
        .eq("status", "scored")
        .not("score", "is", null)
        .order("created_at", { ascending: false })
        .limit(14);

      if (queryError) throw queryError;
      if (!isMountedRef.current) return;

      const scores = (data ?? []).map((r) => r.score as number);

      if (scores.length === 0) {
        setStats({ avgScore: null, scoredCount: 0, trend: null, sparkline: [] });
        return;
      }

      // Overall avg across the fetched window
      const avgScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

      // Trend: avg of last 7 vs avg of prior 7
      const last7 = scores.slice(0, 7);
      const prior7 = scores.slice(7, 14);
      let trend: number | null = null;
      if (last7.length >= 2 && prior7.length >= 1) {
        const avgLast7 = last7.reduce((s, v) => s + v, 0) / last7.length;
        const avgPrior7 = prior7.reduce((s, v) => s + v, 0) / prior7.length;
        trend = Math.round(avgLast7 - avgPrior7);
      }

      // Sparkline in chronological order (oldest first)
      const sparkline = [...scores].reverse();

      // Get total scored count separately for the sublabel
      const { count } = await supabase
        .from("practice_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "scored")
        .not("score", "is", null);

      if (!isMountedRef.current) return;
      setStats({ avgScore, scoredCount: count ?? scores.length, trend, sparkline });
    } catch (err) {
      if (isMountedRef.current) {
        setError("Failed to load score stats");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}
