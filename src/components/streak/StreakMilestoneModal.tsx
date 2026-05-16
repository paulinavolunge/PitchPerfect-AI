import React, { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, X } from "lucide-react";
import ConfettiEffect from "@/components/animations/ConfettiEffect";
import type { MilestoneValue } from "@/hooks/useStreak";

interface Milestone {
  title: string;
  body: string;
  emoji: string;
}

const MILESTONE_COPY: Record<MilestoneValue, Milestone> = {
  3:   { emoji: "🔥", title: "3-day streak!",      body: "You're building momentum. Most people quit before now." },
  7:   { emoji: "💪", title: "One full week!",      body: "Seven days straight. That's not luck — that's discipline." },
  14:  { emoji: "🚀", title: "Two weeks strong!",   body: "Two weeks of consistent practice. You're serious about this." },
  30:  { emoji: "🏆", title: "30-day warrior!",     body: "A full month. Most reps quit by week two. You're not most reps." },
  60:  { emoji: "⚡", title: "Two months!",          body: "60 days. You've outlasted everyone who started when you did." },
  100: { emoji: "🌟", title: "100 days!",            body: "Three digits. That is legendary consistency." },
  365: { emoji: "👑", title: "One full year!",       body: "365 days. You are elite. This is who you are now." },
};

interface StreakMilestoneModalProps {
  milestone: MilestoneValue;
  onClose: () => void;
}

const StreakMilestoneModal: React.FC<StreakMilestoneModalProps> = ({ milestone, onClose }) => {
  const copy = MILESTONE_COPY[milestone];

  const handleShare = useCallback(async () => {
    const text = `I just hit a ${milestone}-day practice streak on PitchPerfect AI! ${copy.emoji} #SalesTraining #PitchPerfect`;
    try {
      if (navigator.share) {
        await navigator.share({ text, url: window.location.origin });
      } else {
        await navigator.clipboard.writeText(text);
        // Brief success message via title change — avoids toast import cycle
      }
    } catch {
      // user cancelled share — no-op
    }
  }, [milestone, copy.emoji]);

  return (
    <>
      <ConfettiEffect active density={8} duration={4000} />
      <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent
          className="max-w-sm text-center"
          onInteractOutside={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <DialogHeader className="items-center gap-2 pt-2">
            <span className="text-6xl leading-none" aria-hidden="true">
              {copy.emoji}
            </span>
            <DialogTitle className="text-2xl font-bold mt-2">
              {copy.title}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {copy.body}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 rounded-xl bg-orange-50 border border-orange-200 py-4 px-6">
            <p className="text-4xl font-extrabold text-orange-600">{milestone}</p>
            <p className="text-sm text-orange-500 font-medium mt-0.5">
              day streak 🔥
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button className="flex-1" onClick={onClose}>
              Keep going →
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StreakMilestoneModal;
