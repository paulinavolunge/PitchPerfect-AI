/**
 * useUpgradeTriggers — checks whether the contextual upgrade prompt should fire.
 *
 * Trigger: round_3_improvement
 *   • Free-tier user (not premium)
 *   • ≥3 scored rounds
 *   • Current avg score is ≥10 points above the user's very first scored round
 *   • No dismissed upgrade_prompt_events for this trigger in the last 7 days
 *   • No conversion event already logged (user already upgraded)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const TRIGGER_ID = "round_3_improvement";
const IMPROVEMENT_THRESHOLD = 10;   // points
const MIN_ROUNDS = 3;
const COOLDOWN_DAYS = 7;

export interface UpgradeTriggerState {
  shouldShow: boolean;
  isLoading: boolean;
  markShown: () => Promise<string | null>;   // returns event id
  markDismissed: (eventId: string) => Promise<void>;
  markConverted: (eventId: string) => Promise<void>;
}

export function useUpgradeTriggers(): UpgradeTriggerState {
  const { user, isPremium } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!user?.id || isPremium) {
      setShouldShow(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        // ── 1. cooldown check ──────────────────────────────────────────
        const cutoff = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
        const { count: recentDismissals } = await supabase
          .from("upgrade_prompt_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("trigger", TRIGGER_ID)
          .not("dismissed_at", "is", null)
          .gte("dismissed_at", cutoff);

        if (recentDismissals && recentDismissals > 0) {
          if (!cancelled && isMounted.current) setShouldShow(false);
          return;
        }

        // ── 2. already converted? ──────────────────────────────────────
        const { count: conversions } = await supabase
          .from("upgrade_prompt_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("trigger", TRIGGER_ID)
          .eq("converted", true);

        if (conversions && conversions > 0) {
          if (!cancelled && isMounted.current) setShouldShow(false);
          return;
        }

        // ── 3. fetch scored round count + first + avg ──────────────────
        const { data: rounds, error } = await supabase
          .from("practice_sessions")
          .select("score, created_at")
          .eq("user_id", user.id)
          .eq("status", "scored")
          .not("score", "is", null)
          .order("created_at", { ascending: true });

        if (error || !rounds || rounds.length < MIN_ROUNDS) {
          if (!cancelled && isMounted.current) setShouldShow(false);
          return;
        }

        const scores = rounds.map((r) => r.score as number);
        const firstScore = scores[0];
        const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
        const improved = avg - firstScore >= IMPROVEMENT_THRESHOLD;

        if (!cancelled && isMounted.current) setShouldShow(improved);
      } catch {
        if (!cancelled && isMounted.current) setShouldShow(false);
      } finally {
        if (!cancelled && isMounted.current) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id, isPremium]);

  const markShown = useCallback(async (): Promise<string | null> => {
    if (!user?.id) return null;
    const { data } = await supabase
      .from("upgrade_prompt_events")
      .insert({ user_id: user.id, trigger: TRIGGER_ID })
      .select("id")
      .single();
    return data?.id ?? null;
  }, [user?.id]);

  const markDismissed = useCallback(async (eventId: string): Promise<void> => {
    if (!user?.id || !eventId) return;
    await supabase
      .from("upgrade_prompt_events")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("id", eventId);
    // Reset shouldShow so it won't fire again this session
    setShouldShow(false);
  }, [user?.id]);

  const markConverted = useCallback(async (eventId: string): Promise<void> => {
    if (!user?.id || !eventId) return;
    await supabase
      .from("upgrade_prompt_events")
      .update({ converted: true, dismissed_at: new Date().toISOString() })
      .eq("id", eventId);
    setShouldShow(false);
  }, [user?.id]);

  return { shouldShow, isLoading, markShown, markDismissed, markConverted };
}
