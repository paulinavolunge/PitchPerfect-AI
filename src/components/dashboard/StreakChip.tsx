import React from "react";
import { cn } from "@/lib/utils";

interface StreakChipProps {
  streak: number;
  atRisk: boolean;
}

const StreakChip: React.FC<StreakChipProps> = ({ streak, atRisk }) => {
  const hasStreak = streak > 0;

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card border border-border p-5 h-full min-h-[120px] text-center">
      <span
        className={cn(
          "text-4xl leading-none select-none",
          atRisk && "animate-pulse"
        )}
      >
        🔥
      </span>
      <p className="text-2xl font-bold text-foreground leading-tight">
        {hasStreak ? `${streak}-day streak` : "No streak yet"}
      </p>
      <p className="text-xs text-muted-foreground">
        {hasStreak
          ? atRisk
            ? "Practice today to keep it"
            : "You practiced today — keep it up!"
          : "Start your streak today"}
      </p>
    </div>
  );
};

export default StreakChip;
