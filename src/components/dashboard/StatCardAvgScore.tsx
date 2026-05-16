import React from "react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useRoundStats } from "@/hooks/useRoundStats";

function TrendPill({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        <TrendingUp className="h-3 w-3" />
        +{delta}
      </span>
    );
  }
  if (delta < -5) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        <TrendingDown className="h-3 w-3" />
        {delta}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
      <Minus className="h-3 w-3" />
      {delta === 0 ? "flat" : `${delta}`}
    </span>
  );
}

function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const data = scores.map((v) => ({ v }));
  return (
    <div className="mt-2 h-8 w-full rounded bg-muted">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
    <>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-16 animate-pulse rounded bg-muted" />
        ) : stats.avgScore === null ? (
          <>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-muted-foreground">Complete a round to see your average.</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-foreground">{stats.avgScore}%</div>
              {stats.trend !== null && <TrendPill delta={stats.trend} />}
            </div>
            <p className="text-xs text-muted-foreground">
              across {stats.scoredCount} scored round{stats.scoredCount !== 1 ? "s" : ""}
            </p>
            <Sparkline scores={stats.sparkline} />
          </>
        )}
      </CardContent>
    </>
  );
};

export default StatCardAvgScore;
