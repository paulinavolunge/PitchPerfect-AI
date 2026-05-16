/**
 * StatsStrip — 3-card performance summary strip for the dashboard.
 * grid-cols-1 md:grid-cols-3 gap-4; each card has hover:ring-1 hover:ring-primary/30.
 */
import React from "react";
import StatCardAvgScore from "./StatCardAvgScore";
import StatCardWeeklyProgress from "./StatCardWeeklyProgress";
import StatCardWeakestArea from "./StatCardWeakestArea";

const StatsStrip: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    <StatCardAvgScore />
    <StatCardWeeklyProgress />
    <StatCardWeakestArea />
  </div>
);

export default StatsStrip;
