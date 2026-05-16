import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const MIN_ROUNDS_FOR_INSIGHT = 3;

const AREA_DISPLAY: Record<string, string> = {
  budget: "Budget objections",
  think: "Think-about-it",
  email: "Send-me-an-email",
  competitor: "Competitor",
  timing: "Timing objections",
  team: "Loop-in-team",
  "custom: price": "Price objections",
  general: "General pitch",
};

function formatArea(raw: string): string {
  return AREA_DISPLAY[raw] ?? raw.replace(/_/g, " ");
}

function scoreColor(score: number) {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-amber-400";
  return "bg-red-500";
}

interface WeakestAreaData {
  area: string | null;
  avgScore: number | null;
  scoredCount: number;
}

function useWeakestArea(): WeakestAreaData & { isLoading: boolean } {
  const { user } = useAuth();
  const isMounted = useRef(true);
  const [data, setData] = useState<WeakestAreaData>({ area: null, avgScore: null, scoredCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const [weakestRes, countRes] = await Promise.all([
        supabase.rpc("get_user_weakest_area", { p_user_id: user.id }),
        supabase
          .from("practice_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "scored")
          .not("score", "is", null),
      ]);

      if (!isMounted.current) return;

      const area = (weakestRes.data as string | null) ?? null;
      const totalCount = countRes.count ?? 0;

      // Fetch avg score for that specific area
      let avgScore: number | null = null;
      if (area && totalCount >= MIN_ROUNDS_FOR_INSIGHT) {
        const { data: areaRows } = await supabase
          .from("practice_sessions")
          .select("score")
          .eq("user_id", user.id)
          .eq("status", "scored")
          .eq("scenario_type", area)
          .not("score", "is", null)
          .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        if (areaRows && areaRows.length > 0) {
          const sum = areaRows.reduce((acc, r) => acc + (r.score as number), 0);
          avgScore = Math.round(sum / areaRows.length);
        }
      }

      if (!isMounted.current) return;
      setData({ area, avgScore, scoredCount: totalCount });
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => { isMounted.current = false; };
  }, [load]);

  return { ...data, isLoading };
}

const StatCardWeakestArea: React.FC = () => {
  const navigate = useNavigate();
  const { area, avgScore, scoredCount, isLoading } = useWeakestArea();

  const enoughData = scoredCount >= MIN_ROUNDS_FOR_INSIGHT;

  const handleDrill = () => {
    if (!area) return;
    navigate(`/rounds/new?scenario=${encodeURIComponent(area)}`);
  };

  return (
    <Card className="transition-shadow hover:ring-1 hover:ring-primary/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Weakest Area</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-8 w-32" />
          </div>
        ) : !enoughData ? (
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Complete {MIN_ROUNDS_FOR_INSIGHT - scoredCount} more round{MIN_ROUNDS_FOR_INSIGHT - scoredCount !== 1 ? "s" : ""} to see your patterns.
            </p>
          </div>
        ) : !area ? (
          <div>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-muted-foreground mt-1">No weakness detected — great variety!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Area name */}
            <div>
              <p className="text-lg font-bold text-foreground capitalize leading-tight">
                {formatArea(area)}
              </p>
              {avgScore !== null && (
                <p className="text-xs text-muted-foreground mt-0.5">avg {avgScore}% over 30 days</p>
              )}
            </div>

            {/* Score bar */}
            {avgScore !== null && (
              <div aria-label={`Score bar: ${avgScore}%`}>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", scoreColor(avgScore))}
                    style={{ width: `${avgScore}%` }}
                  />
                </div>
              </div>
            )}

            {/* Drill CTA */}
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDrill}
              className="h-7 px-3 text-xs gap-1.5 w-full sm:w-auto"
            >
              <ChevronRight className="h-3 w-3" />
              Drill this now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCardWeakestArea;
