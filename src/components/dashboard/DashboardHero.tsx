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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 items-stretch">
        {/* LEFT — streak widget */}
        <div className="md:col-span-1">
          <StreakChipWidget streak={streak} atRisk={atRisk} freezesAvailable={freezesAvailable} />
        </div>

        {/* RIGHT — greeting + CTA */}
        <div className="md:col-span-3 flex flex-col justify-center gap-3 rounded-2xl bg-card border border-border p-5">
          <div>
            <h1 className="text-3xl font-bold text-foreground leading-tight">
              Hey, {firstName} —
            </h1>
            <p className="mt-1 text-base text-muted-foreground">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleCTA}
              className={[
                "bg-primary text-primary-foreground shadow-lg",
                "h-14 md:h-16 px-8",
                "text-lg md:text-xl font-semibold",
                "flex items-center gap-2",
              ].join(" ")}
            >
              <Play className="h-5 w-5 fill-current" />
              Start a 90-sec round
            </Button>

            {/* Show freeze button prominently when streak is at risk */}
            {atRisk && streak > 0 && (
              <StreakFreezeButton
                freezesAvailable={freezesAvailable}
                atRisk={atRisk}
                onUseFreeze={useFreeze}
              />
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
