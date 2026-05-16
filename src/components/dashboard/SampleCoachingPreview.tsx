/**
 * SampleCoachingPreview — decorative preview shown inside FirstRoundEmptyState.
 * Animated mock waveform + blurred sample coaching card.
 * aria-hidden throughout; not interactive.
 */
import React from "react";

// Fixed bar heights give a natural-looking waveform silhouette
const BAR_HEIGHTS = [
  35, 58, 72, 45, 88, 62, 40, 76, 55, 90,
  48, 68, 38, 82, 60, 44, 78, 52, 86, 65,
  42, 70, 50, 84, 58, 46, 74, 56,
];

const SAMPLE_CARDS = [
  {
    emoji: "💬",
    label: "Talk ratio",
    finding: "You spoke for 78% of the call.",
    why: "Top closers let prospects talk at least 40% of the time.",
    severity: "critical",
  },
  {
    emoji: "🎤",
    label: "Pace",
    finding: "Slowed down before the close — great instinct.",
    why: "Deliberate pacing signals confidence and invites the other side to respond.",
    severity: "info",
  },
  {
    emoji: "🔥",
    label: "Filler words",
    finding: '"Um" appeared 11 times in 90 seconds.',
    why: "Fillers erode authority. Silence reads as confidence.",
    severity: "warning",
  },
];

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-400",
  warning: "bg-amber-400",
  info: "bg-blue-400",
};

const SampleCoachingPreview: React.FC = () => (
  <div
    className="relative w-full max-w-md mx-auto select-none"
    aria-hidden="true"
    tabIndex={-1}
  >
    {/* "Sample" badge */}
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full shadow">
      Sample
    </div>

    <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
      {/* Waveform section */}
      <div className="px-5 pt-6 pb-3 bg-muted/30">
        <div
          className="flex items-end gap-px"
          style={{ height: 56 }}
        >
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-primary/35"
              style={{
                height: `${h}%`,
                animation: "ppWave 1.4s ease-in-out infinite alternate",
                animationDelay: `${(i * 55) % 900}ms`,
                transformOrigin: "bottom",
              }}
            />
          ))}
        </div>
        {/* Duration labels */}
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
          <span>0:00</span>
          <span>1:30</span>
        </div>
      </div>

      {/* Coaching cards — blurred */}
      <div className="px-4 pb-5 pt-3 space-y-2.5 relative">
        {/* Blur overlay */}
        <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-b from-transparent via-background/10 to-background/80 z-10 rounded-b-2xl pointer-events-none" />

        {SAMPLE_CARDS.map((card, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-background px-3.5 py-3 flex items-start gap-3"
            style={{
              filter: i > 0 ? "blur(3px)" : "blur(0)",
              opacity: i > 0 ? 0.6 : 1,
            }}
          >
            {/* Icon chip */}
            <div className="flex-shrink-0 w-8 h-8 rounded-lg border border-border bg-muted flex items-center justify-center text-base leading-none">
              {card.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SEVERITY_DOT[card.severity]}`}
                />
              </div>
              <p className="text-xs font-medium text-foreground leading-snug">
                {card.finding}
              </p>
              {i === 0 && (
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                  {card.why}
                </p>
              )}
            </div>
            {/* Fake Practice button */}
            <div className="flex-shrink-0 h-6 w-16 rounded-md bg-primary/80 flex items-center justify-center">
              <span className="text-[9px] font-semibold text-primary-foreground">Practice</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* CSS keyframe for waveform animation */}
    <style>{`
      @keyframes ppWave {
        from { transform: scaleY(1); }
        to   { transform: scaleY(0.25); }
      }
    `}</style>
  </div>
);

export default SampleCoachingPreview;
