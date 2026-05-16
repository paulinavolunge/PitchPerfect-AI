/**
 * StatsStrip — 3-card performance summary.
 *
 * Mobile  : horizontal scroll-snap row (one card ≈ 80vw, peek of next).
 * Desktop : 3-column grid.
 *
 * Each card has hover:ring-1 hover:ring-primary/30 (desktop only).
 * The mobile scroll-snap container hides the scrollbar for a native feel.
 */
import React from "react";
import StatCardAvgScore from "./StatCardAvgScore";
import StatCardWeeklyProgress from "./StatCardWeeklyProgress";
import StatCardWeakestArea from "./StatCardWeakestArea";

const CARDS = [StatCardAvgScore, StatCardWeeklyProgress, StatCardWeakestArea];

const StatsStrip: React.FC = () => (
  <div className="mb-8">
    {/* ── Mobile: horizontal scroll-snap ── */}
    <div
      className={[
        "flex md:hidden gap-3",
        "overflow-x-auto snap-x snap-mandatory",
        "-mx-4 px-4",           // bleed to screen edge so peek is visible
        "pb-2",                 // room for the scroll indicator shadow
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      ].join(" ")}
      role="list"
      aria-label="Performance stats"
    >
      {CARDS.map((Card, i) => (
        <div
          key={i}
          className="snap-start flex-shrink-0 w-[80vw] min-w-0"
          role="listitem"
        >
          <Card />
        </div>
      ))}
      {/* Trailing spacer so last card doesn't flush to the right edge */}
      <div className="flex-shrink-0 w-4" aria-hidden="true" />
    </div>

    {/* ── Desktop: 3-column grid ── */}
    <div className="hidden md:grid md:grid-cols-3 gap-4">
      {CARDS.map((Card, i) => (
        <Card key={i} />
      ))}
    </div>
  </div>
);

export default StatsStrip;
