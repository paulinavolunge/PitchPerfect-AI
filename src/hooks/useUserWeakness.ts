import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface WeaknessData {
  weakestArea: string | null; // scenario_type string, or null if <3 rounds
  isFirstTime: boolean;       // user has 0 scored rounds ever
}

export function useUserWeakness() {
  const { user } = useAuth();
  const isMounted = useRef(true);
  const [data, setData] = useState<WeaknessData>({ weakestArea: null, isFirstTime: true });
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [weakestResult, countResult] = await Promise.all([
        supabase.rpc("get_user_weakest_area", { p_user_id: user.id }),
        supabase
          .from("practice_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "scored")
          .not("score", "is", null),
      ]);

      if (!isMounted.current) return;
      setData({
        weakestArea: (weakestResult.data as string | null) ?? null,
        isFirstTime: (countResult.count ?? 0) === 0,
      });
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

  return { ...data, isLoading };
}
