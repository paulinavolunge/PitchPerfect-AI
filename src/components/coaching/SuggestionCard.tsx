/**
 * SuggestionCard — one AI coaching insight with a Practice CTA and Why collapsible.
 */
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { CoachingCategory, CoachingSeverity } from "@/hooks/useLatestScoredRound";

const CATEGORY_EMOJI: Record<CoachingCategory, string> = {
  talk_ratio:     "💬",
  objection_step: "🎯",
  filler_words:   "🔥",
  confidence:     "🛡️",
  pace:           "🎤",
  closing:        "✅",
};

const CATEGORY_LABEL: Record<CoachingCategory, string> = {
  talk_ratio:     "Talk ratio",
  objection_step: "Objection step",
  filler_words:   "Filler words",
  confidence:     "Confidence",
  pace:           "Pace",
  closing:        "Closing",
};

const SEVERITY_STYLE: Record<CoachingSeverity, string> = {
  critical: "ring-red-300 bg-red-50/60",
  warning:  "ring-amber-300 bg-amber-50/60",
  info:     "ring-blue-200 bg-blue-50/40",
};

const SEVERITY_DOT: Record<CoachingSeverity, string> = {
  critical: "bg-red-500",
  warning:  "bg-amber-400",
  info:     "bg-blue-500",
};

interface SuggestionCardProps {
  category: CoachingCategory;
  severity: CoachingSeverity;
  findingText: string;
  whyText: string;
  scenarioType: string;
  timestampSec: number | null;
  className?: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  category,
  severity,
  findingText,
  whyText,
  scenarioType,
  className,
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const handlePractice = () => {
    navigate(`/practice?scenario=${encodeURIComponent(scenarioType)}&difficulty=hard`);
  };

  return (
    <div
      className={cn(
        "bg-card ring-1 ring-border rounded-xl p-4 space-y-3 transition-shadow hover:shadow-sm",
        SEVERITY_STYLE[severity],
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-background border border-border text-lg leading-none select-none">
          {CATEGORY_EMOJI[category]}
        </div>

        <div className="flex-1 min-w-0">
          {/* Category label + severity dot */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {CATEGORY_LABEL[category]}
            </span>
            <span
              className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", SEVERITY_DOT[severity])}
              aria-label={`Severity: ${severity}`}
            />
          </div>
          {/* Main finding */}
          <p className="text-sm font-medium text-foreground leading-snug">{findingText}</p>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 pt-0.5">
        {/* Practice CTA */}
        <Button
          size="sm"
          variant="default"
          onClick={handlePractice}
          className="h-7 px-3 text-xs gap-1.5"
          aria-label={`Practice ${CATEGORY_LABEL[category]}`}
        >
          <Play className="h-3 w-3 fill-current" />
          Practice
        </Button>

        {/* Why collapsible trigger */}
        <Collapsible open={open} onOpenChange={setOpen} className="flex-1">
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
              aria-expanded={open}
            >
              Why
              <ChevronDown
                className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-2 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-2">
              {whyText}
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default SuggestionCard;
