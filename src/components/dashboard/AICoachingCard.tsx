/**
 * AICoachingCard — dashboard widget showing the latest scored round with
 * inline AI coaching suggestions.
 *
 * • Slides up on mount (animate-in slide-in-from-bottom-2)
 * • Score displayed with traffic-light color (green ≥70, amber ≥50, red <50)
 * • RoundScrubber shows waveform + feedback timestamp markers
 * • 3 SuggestionCards below, stacked
 * • [Share with manager] for Team plan users — copies a public link to clipboard
 */
import React, { useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Clock, Share2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLatestScoredRound } from "@/hooks/useLatestScoredRound";
import RoundScrubber from "@/components/coaching/RoundScrubber";
import SuggestionCard from "@/components/coaching/SuggestionCard";

function scoreColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function ScoreTrend({ score }: { score: number }) {
  if (score >= 70) return <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />;
  if (score >= 50) return <Minus className="h-4 w-4 text-amber-500" aria-hidden="true" />;
  return <TrendingDown className="h-4 w-4 text-red-500" aria-hidden="true" />;
}

function formatDur(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const LoadingSkeleton: React.FC = () => (
  <Card className="bg-card ring-1 ring-border rounded-xl overflow-hidden">
    <CardHeader className="pb-3">
      <Skeleton className="h-5 w-40" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-14 w-full" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </CardContent>
  </Card>
);

const AICoachingCard: React.FC = () => {
  const { round, isTeamPlan, isLoading, error } = useLatestScoredRound();

  const handleShare = useCallback(async () => {
    if (!round) return;
    const url = `${window.location.origin}/rounds/${round.id}?share=true`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied — share it with your manager.", { duration: 3000 });
    } catch {
      toast.error("Couldn't copy link. Try again.");
    }
  }, [round]);

  if (isLoading) return <LoadingSkeleton />;

  if (error || !round) {
    return (
      <Card className="bg-card ring-1 ring-border rounded-xl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-3 opacity-30" />
          Complete a scored round to unlock AI coaching.
        </CardContent>
      </Card>
    );
  }

  const hasFeedback = round.feedback.length > 0;

  return (
    <Card
      className={cn(
        "bg-card ring-1 ring-border rounded-xl overflow-hidden",
        "animate-in slide-in-from-bottom-2 duration-500 fill-mode-both"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
            <h2 className="text-base font-semibold text-foreground">AI Coaching</h2>
          </div>

          {isTeamPlan && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleShare}
              className="h-7 px-2.5 text-xs gap-1.5 flex-shrink-0"
              aria-label="Share round with manager"
            >
              <Share2 className="h-3 w-3" />
              Share with manager
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Round metadata row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-medium text-foreground capitalize">
            {round.scenario_type.replace(/_/g, " ")}
          </span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-xs text-muted-foreground capitalize">{round.difficulty}</span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {formatDur(round.duration_seconds)}
          </span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(round.created_at), { addSuffix: true })}
          </span>
          {/* Score */}
          <div className="ml-auto flex items-center gap-1">
            <ScoreTrend score={round.score} />
            <span className={cn("text-lg font-bold", scoreColor(round.score))}>
              {round.score}%
            </span>
          </div>
        </div>

        {/* Waveform scrubber */}
        <RoundScrubber
          roundId={round.id}
          durationSeconds={round.duration_seconds}
          feedback={round.feedback}
        />

        {/* Suggestion cards */}
        {hasFeedback ? (
          <div className="space-y-2.5">
            {round.feedback.slice(0, 3).map((item) => (
              <SuggestionCard
                key={item.id}
                category={item.category}
                severity={item.severity}
                findingText={item.finding_text}
                whyText={item.why_text}
                scenarioType={round.scenario_type}
                timestampSec={item.timestamp_sec}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-muted/40 border border-border px-4 py-5 text-center text-sm text-muted-foreground">
            <p className="font-medium mb-1">Coaching analysis pending</p>
            <p className="text-xs">
              Detailed feedback will appear here after your next scored round.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AICoachingCard;
