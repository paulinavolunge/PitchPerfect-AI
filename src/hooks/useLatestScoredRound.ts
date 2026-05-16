import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type CoachingCategory =
  | "talk_ratio"
  | "objection_step"
  | "filler_words"
  | "confidence"
  | "pace"
  | "closing";

export type CoachingSeverity = "critical" | "warning" | "info";

export interface CoachingFeedback {
  id: string;
  category: CoachingCategory;
  severity: CoachingSeverity;
  timestamp_sec: number | null;
  finding_text: string;
  why_text: string;
}

export interface LatestScoredRound {
  id: string;
  scenario_type: string;
  difficulty: string;
  duration_seconds: number;
  score: number;
  created_at: string;
  feedback: CoachingFeedback[];
}

export function useLatestScoredRound() {
  const { user } = useAuth();
  const isMounted = useRef(true);
  const [round, setRound] = useState<LatestScoredRound | null>(null);
  const [isTeamPlan, setIsTeamPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [sessionRes, profileRes] = await Promise.all([
        supabase
          .from("practice_sessions")
          .select("id, scenario_type, difficulty, duration_seconds, score, created_at")
          .eq("user_id", user.id)
          .eq("status", "scored")
          .not("score", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("user_profiles")
          .select("subscription_plan")
          .eq("id", user.id)
          .single(),
      ]);

      if (!isMounted.current) return;

      if (sessionRes.error || !sessionRes.data) {
        setRound(null);
        setIsLoading(false);
        return;
      }

      const r = sessionRes.data;

      // Fetch coaching feedback for this round
      const { data: feedbackRows } = await supabase
        .from("coaching_feedback")
        .select("id, category, severity, timestamp_sec, finding_text, why_text")
        .eq("round_id", r.id)
        .order("severity", { ascending: true }) // critical first
        .limit(3);

      if (!isMounted.current) return;

      setRound({
        id: r.id,
        scenario_type: r.scenario_type,
        difficulty: r.difficulty,
        duration_seconds: r.duration_seconds,
        score: r.score as number,
        created_at: r.created_at,
        feedback: (feedbackRows ?? []) as CoachingFeedback[],
      });

      const plan = profileRes.data?.subscription_plan ?? "";
      setIsTeamPlan(plan.toLowerCase().includes("team"));
    } catch (err) {
      if (isMounted.current) setError("Failed to load coaching data.");
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    isMounted.current = true;
    fetch();
    return () => { isMounted.current = false; };
  }, [fetch]);

  return { round, isTeamPlan, isLoading, error, refetch: fetch };
}
