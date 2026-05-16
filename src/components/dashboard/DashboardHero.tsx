import React, { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import StreakChipWidget from "./StreakChip";
import StreakFreezeButton from "@/components/streak/StreakFreezeButton";
import { useStreak } from "@/hooks/useStreak";
import { useUserWeakness } from "@/hooks/useUserWeakness";

const StreakMilestoneModal = lazy(() => import("@/components/streak/StreakMilestoneModal"));

const AREA_LABELS: Record<string, string> = {
  Price: "price",
  Authority: "authority",
  Budget: "budget",
  Need: "need",
  Timing: "timing",
  "Think About It": "'think about it'",
  "Send Me an Email": "'send me an email'",
};

function getSubtitle(weakestArea: string | null, isFirstTime: boolean): string {
  if (isFirstTime) return "Let's see what you're made of. Drop in and get scored.";
  if (!weakestArea) return "Consistency is everything — keep showing up.";
  const label = AREA_LABELS[weakestArea] ?? weakestArea.toLowerCase();
  return `Your ${label} objections need work. Let's fix that today.`;
}

interface DashboardHeroProps {
  firstName: string;
  onStartPractice?: () => void;
}

const DashboardHero: React.FC<DashboardHeroProps> = ({ firstName, onStartPractice }) => {
  const navigate = useNavigate();
  const {
    streak,
    atRisk,
    freezesAvailable,
    newMilestone,
    useFreeze,
    dismissMilestone,
  } = useStreak();
  const { weakestArea, isFirstTime } = useUserWeakness();

  const handleCTA = () => {
    if (onStartPractice) {
      onStartPractice();
      return;
    }
    navigate("/practice", { state: { scenario: weakestArea } });
  };

  const subtitle = getSubtitle(weakestArea, isFirstTime);

  return (
    <>
      {/*
        Mobile: StreakChip on top, greeting + CTA below (stacked).
        Desktop: streak chip in 1/4 left column, greeting in 3/4 right.
      */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-stretch">
        {/* Streak chip — full-width pill on mobile, left column on desktop */}
        <div className="md:col-span-1">
          <StreakChipWidget streak={streak} atRisk={atRisk} freezesAvailable={freezesAvailable} />
        </div>

        {/* Greeting + CTA */}
        <div className="md:col-span-3 flex flex-col justify-center gap-4 rounded-2xl bg-card border border-border p-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              Hey, {firstName} —
            </h1>
            <p className="mt-1 text-sm md:text-base text-muted-foreground">{subtitle}</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            {/* Full-width on mobile, auto-width on sm+ */}
            <Button
              onClick={handleCTA}
              className={[
                "bg-primary text-primary-foreground shadow-lg",
                "h-12 md:h-14 px-6 md:px-8",
                "text-base md:text-lg font-semibold",
                "w-full sm:w-auto",
                "flex items-center justify-center gap-2 min-h-[44px]",
              ].join(" ")}
            >
              <Play className="h-5 w-5 fill-current flex-shrink-0" />
              Start a 90-sec round
            </Button>

            {/* Freeze button — only shown at-risk, full-width on mobile */}
            {atRisk && streak > 0 && (
              <div className="w-full sm:w-auto">
                <StreakFreezeButton
                  freezesAvailable={freezesAvailable}
                  atRisk={atRisk}
                  onUseFreeze={useFreeze}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Milestone modal — lazy loaded, fires at most once per milestone */}
      {newMilestone && (
        <Suspense fallback={null}>
          <StreakMilestoneModal milestone={newMilestone} onClose={dismissMilestone} />
        </Suspense>
      )}
    </>
  );
};

export default DashboardHero;
