import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const DAILY_GOAL = 1; // rounds per day
const WEEKLY_GOAL = DAILY_GOAL * 7;

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/** Returns [mondayDate, sundayDate] for the current ISO week (Mon–Sun). */
function currentWeekRange(): [Date, Date] {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun … 6=Sat
  const toMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + toMonday);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
  return [monday, sunday];
}

/** Returns 0 for Mon, 6 for Sun (ISO weekday index). */
function isoDay(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Days remaining in the week including today (min 0). */
function daysLeft(): number {
  const dow = new Date().getDay();
  return dow === 0 ? 0 : 7 - dow;
}

const StatCardWeeklyProgress: React.FC = () => {
  const { user } = useAuth();
  const isMounted = useRef(true);
  const [daysWithRound, setDaysWithRound] = useState<boolean[]>(Array(7).fill(false));
  const [weekCount, setWeekCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const [monday, sunday] = currentWeekRange();
      const { data } = await supabase
        .from("practice_sessions")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("status", "scored")
        .not("score", "is", null)
        .gte("created_at", monday.toISOString())
        .lte("created_at", sunday.toISOString());

      if (!isMounted.current) return;
      const rows = data ?? [];
      const filled = Array(7).fill(false);
      rows.forEach((r) => { filled[isoDay(new Date(r.created_at))] = true; });
      setDaysWithRound(filled);
      setWeekCount(rows.length);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => { isMounted.current = false; };
  }, [load]);

  const todayIdx = isoDay(new Date());
  const left = daysLeft();

  return (
    <Card className="transition-shadow hover:ring-1 hover:ring-primary/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Rounds This Week</CardTitle>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-foreground">{weekCount}</span>
              <span className="text-lg font-medium text-muted-foreground">/ {WEEKLY_GOAL}</span>
            </div>

            {/* Day dots — M T W T F S S */}
            <div className="mt-3 flex items-center gap-1.5">
              {DAY_LABELS.map((label, i) => {
                const done = daysWithRound[i];
                const isToday = i === todayIdx;
                const isFuture = i > todayIdx;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full transition-colors",
                        done
                          ? "bg-primary"
                          : isToday
                          ? "bg-primary/30 ring-1 ring-primary animate-pulse"
                          : isFuture
                          ? "bg-muted"
                          : "bg-muted/60"
                      )}
                      aria-label={`${label}: ${done ? "done" : isToday ? "today" : isFuture ? "upcoming" : "missed"}`}
                    />
                    <span
                      className={cn(
                        "text-[9px] font-medium select-none",
                        isToday ? "text-primary" : "text-muted-foreground/60"
                      )}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {left === 0
                ? weekCount >= WEEKLY_GOAL
                  ? "Week complete — great work! 🎉"
                  : "Last chance — practice today!"
                : `${left} day${left !== 1 ? "s" : ""} left in the week`}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCardWeeklyProgress;
