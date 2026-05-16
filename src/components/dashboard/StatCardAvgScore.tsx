import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useRoundStats } from "@/hooks/useRoundStats";

function scoreColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function TrendPill({ delta }: { delta: number }) {
  if (delta > 0)
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        <TrendingUp className="h-3 w-3" />+{delta}
      </span>
    );
  if (delta < 0)
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        <TrendingDown className="h-3 w-3" />
        {delta}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
      <Minus className="h-3 w-3" />flat
    </span>
  );
}

function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  return (
    <div className="mt-3 h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={scores.map((v) => ({ v }))}>
          <Line
            type="monotone"
            dataKey="v"
            stroke="hsl(var(--chart-1))"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const StatCardAvgScore: React.FC = () => {
  const { stats, isLoading } = useRoundStats();

  return (
    <Card className="transition-shadow hover:ring-1 hover:ring-primary/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
        ) : stats.avgScore === null ? (
          <>
            <div className="text-3xl font-extrabold text-foreground">—</div>
            <p className="text-xs text-muted-foreground mt-1">
              Complete a round to see your average.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-3xl font-extrabold", scoreColor(stats.avgScore))}>
                {stats.avgScore}%
              </span>
              {stats.trend !== null && <TrendPill delta={stats.trend} />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              across {stats.scoredCount} scored round{stats.scoredCount !== 1 ? "s" : ""} · vs prior 7 days
            </p>
            <Sparkline scores={stats.sparkline} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCardAvgScore;
