/**
 * StreakChip — compact header badge.
 * Shows flame + count; pulses the flame when streak is at risk after 18:00.
 */
import React from "react";
import { cn } from "@/lib/utils";
import { useStreak } from "@/hooks/useStreak";

const StreakChip: React.FC = () => {
  const { streak, atRisk, isLoading } = useStreak();

  if (isLoading || streak === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold transition-colors select-none",
        atRisk
          ? "bg-red-100 text-red-700 ring-1 ring-red-300"
          : "bg-orange-100 text-orange-700"
      )}
      title={atRisk ? `${streak}-day streak at risk — practice before midnight!` : `${streak}-day streak`}
      aria-label={`${streak}-day practice streak${atRisk ? ', at risk' : ''}`}
    >
      <span
        className={cn(
          "leading-none",
          atRisk && "animate-bounce"
        )}
        aria-hidden="true"
      >
        🔥
      </span>
      <span>{streak}</span>
    </div>
  );
};

export default StreakChip;
