/**
 * ContextualUpgradeModal — fires after the post-round coaching screen dismisses.
 *
 * NOT a generic "upgrade now" banner. It appears only when the user has
 * demonstrated real improvement (trigger: round_3_improvement), making the
 * pitch feel earned rather than interrupting.
 */
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrendingUp, Headphones, BarChart2, Mic, ArrowRight, Loader2 } from "lucide-react";

const FEATURE_BULLETS = [
  {
    Icon: Headphones,
    text: "Hear yourself at the moments you scored highest.",
  },
  {
    Icon: BarChart2,
    text: "Replay your weak moments with full frame-by-frame coaching.",
  },
  {
    Icon: Mic,
    text: "See every filler word highlighted on the timeline.",
  },
];

interface ContextualUpgradeModalProps {
  open: boolean;
  onUpgrade: () => void;
  onSkip: () => void;
  isUpgradeLoading?: boolean;
}

const ContextualUpgradeModal: React.FC<ContextualUpgradeModalProps> = ({
  open,
  onUpgrade,
  onSkip,
  isUpgradeLoading = false,
}) => (
  <Dialog open={open} onOpenChange={(o) => { if (!o) onSkip(); }}>
    <DialogContent
      className="max-w-md p-0 overflow-hidden gap-0"
      onInteractOutside={(e) => e.preventDefault()} // force explicit choice
    >
      {/* Gradient top bar — conveys positive momentum */}
      <div className="h-1 w-full bg-gradient-to-r from-green-400 via-emerald-400 to-blue-500" />

      <div className="px-6 pt-6 pb-5 space-y-5">
        <DialogHeader className="space-y-2 text-left">
          {/* Momentum icon */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-green-600">
              You're improving
            </span>
          </div>

          <DialogTitle className="text-xl font-extrabold text-foreground leading-tight">
            You're improving fast.{" "}
            <span className="text-primary">Don't lose momentum.</span>
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Unlock playback + full coaching breakdown for every round.
          </DialogDescription>
        </DialogHeader>

        {/* Feature bullets */}
        <ul className="space-y-3" role="list">
          {FEATURE_BULLETS.map(({ Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </div>
              <span className="text-sm text-foreground leading-snug">{text}</span>
            </li>
          ))}
        </ul>

        {/* Pricing + CTA */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-foreground">$29</span>
            <span className="text-sm text-muted-foreground">/mo · cancel anytime</span>
          </div>
          <Button
            onClick={onUpgrade}
            disabled={isUpgradeLoading}
            className="w-full h-11 text-sm font-semibold gap-2"
          >
            {isUpgradeLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening checkout…
              </>
            ) : (
              <>
                Unlock Pro — $29/mo
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Skip link */}
        <div className="text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Skip — keep practicing free
          </button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default ContextualUpgradeModal;
