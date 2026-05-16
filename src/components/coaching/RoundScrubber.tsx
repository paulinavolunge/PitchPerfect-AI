/**
 * RoundScrubber — visual timeline for a practice round.
 *
 * Desktop: waveform bars + colored marker dots at feedback timestamps.
 * Mobile: compact horizontal progress bar with the same markers.
 */
import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CoachingFeedback, CoachingSeverity } from "@/hooks/useLatestScoredRound";

const BAR_COUNT = 60;

/** Deterministic pseudo-random seeded on round id for consistent waveform shape. */
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h ^= h >>> 16;
    return (h >>> 0) / 0x100000000;
  };
}

const SEVERITY_DOT: Record<CoachingSeverity, string> = {
  critical: "bg-red-500 ring-red-200",
  warning:  "bg-amber-400 ring-amber-200",
  info:     "bg-blue-500 ring-blue-200",
};

const CATEGORY_EMOJI: Record<string, string> = {
  talk_ratio:    "💬",
  objection_step: "🎯",
  filler_words:  "🔥",
  confidence:    "🛡️",
  pace:          "🎤",
  closing:       "✅",
};

interface RoundScrubberProps {
  roundId: string;
  durationSeconds: number;
  feedback: CoachingFeedback[];
  className?: string;
}

const RoundScrubber: React.FC<RoundScrubberProps> = ({
  roundId,
  durationSeconds,
  feedback,
  className,
}) => {
  const bars = useMemo(() => {
    const rng = seededRandom(roundId);
    return Array.from({ length: BAR_COUNT }, () => {
      // Bias toward middle heights with occasional peaks
      const base = rng();
      return Math.max(0.15, base < 0.7 ? base * 0.8 + 0.1 : base);
    });
  }, [roundId]);

  const markers = useMemo(
    () =>
      feedback
        .filter((f) => f.timestamp_sec != null && durationSeconds > 0)
        .map((f) => ({
          pct: Math.min(100, Math.max(0, ((f.timestamp_sec!) / durationSeconds) * 100)),
          severity: f.severity,
          category: f.category,
          finding: f.finding_text,
        })),
    [feedback, durationSeconds]
  );

  return (
    <div className={cn("w-full", className)} aria-label="Round timeline scrubber">
      {/* ── Desktop waveform (hidden on mobile) ──────────────────────── */}
      <div className="hidden sm:block relative w-full" style={{ height: 56 }}>
        <div className="flex items-end gap-px h-full w-full">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-primary/25 hover:bg-primary/50 transition-colors"
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>

        {/* Timestamp markers */}
        {markers.map((m, i) => (
          <div
            key={i}
            className="absolute top-0 h-full flex flex-col items-center group"
            style={{ left: `${m.pct}%`, transform: "translateX(-50%)" }}
          >
            <div className="w-0.5 h-full bg-current opacity-20" />
            <div
              className={cn(
                "absolute -top-1 w-4 h-4 rounded-full ring-2 ring-offset-1 cursor-pointer",
                SEVERITY_DOT[m.severity as CoachingSeverity] ?? "bg-gray-400 ring-gray-200"
              )}
              aria-label={`${CATEGORY_EMOJI[m.category] ?? ""} ${m.finding}`}
            />
            {/* Hover tooltip */}
            <div
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-20
                         whitespace-nowrap rounded-lg bg-popover border border-border px-2.5 py-1.5 text-xs
                         shadow-lg text-popover-foreground"
            >
              <span className="mr-1">{CATEGORY_EMOJI[m.category] ?? "•"}</span>
              {m.finding.length > 60 ? m.finding.slice(0, 57) + "…" : m.finding}
            </div>
          </div>
        ))}
      </div>

      {/* ── Mobile compact bar ───────────────────────────────────────── */}
      <div className="sm:hidden relative w-full h-2 rounded-full bg-muted overflow-visible">
        <div className="absolute inset-0 rounded-full bg-primary/20" />
        {markers.map((m, i) => (
          <div
            key={i}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-1 ring-offset-1",
              SEVERITY_DOT[m.severity as CoachingSeverity] ?? "bg-gray-400"
            )}
            style={{ left: `${m.pct}%`, transform: "translate(-50%, -50%)" }}
            aria-label={m.finding}
          />
        ))}
      </div>

      {/* Duration label */}
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground select-none">
        <span>0:00</span>
        <span>
          {Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
};

export default RoundScrubber;
