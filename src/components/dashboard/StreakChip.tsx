import React from "react";
import { cn } from "@/lib/utils";
import { Snowflake } from "lucide-react";

interface StreakChipProps {
  streak: number;
  atRisk: boolean;
  freezesAvailable?: number;
}

const StreakChip: React.FC<StreakChipProps> = ({ streak, atRisk, freezesAvailable }) => {
  const hasStreak = streak > 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border p-5 h-full min-h-[120px] text-center transition-colors",
        atRisk
          ? "bg-red-50 border-red-200"
          : "bg-card border-border"
      )}
    >
      <span
        className={cn(
          "text-4xl leading-none select-none",
          atRisk && "animate-bounce"
        )}
        aria-hidden="true"
      >
        🔥
      </span>

      <p className="text-2xl font-bold text-foreground leading-tight">
        {hasStreak ? `${streak}-day streak` : "No streak yet"}
      </p>

      <p className={cn(
        "text-xs",
        atRisk ? "text-red-600 font-medium" : "text-muted-foreground"
      )}>
        {hasStreak
          ? atRisk
            ? "Practice today to keep it alive"
            : "You practiced today — keep it up!"
          : "Start your streak today"}
      </p>

      {/* Show freeze inventory when not at risk (the freeze button shows in hero when at risk) */}
      {!atRisk && typeof freezesAvailable === 'number' && freezesAvailable > 0 && (
        <div className="flex items-center gap-1 text-xs text-sky-600 mt-1">
          <Snowflake className="h-3 w-3" aria-hidden="true" />
          <span>{freezesAvailable} freeze{freezesAvailable !== 1 ? 's' : ''} available</span>
        </div>
      )}
    </div>
  );
};

export default StreakChip;
