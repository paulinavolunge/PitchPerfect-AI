import React from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import SampleCoachingPreview from "./SampleCoachingPreview";

const TRUST_SIGNALS = [
  { icon: "🎤", text: "Mic only · no video" },
  { icon: "⏱️", text: "90 seconds" },
  { icon: "🔒", text: "Your audio stays private" },
];

const FirstRoundEmptyState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both w-full">
      <div className="max-w-xl mx-auto text-center px-4 py-10 space-y-8">

        {/* Headline block */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
            Your first round in 90 seconds.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            We'll listen, transcribe, and tell you exactly where you sound
            confident — and where you don't.
          </p>
        </div>

        {/* Animated preview (decorative) */}
        <SampleCoachingPreview />

        {/* Giant CTA */}
        <div className="space-y-4">
          <Button
            size="lg"
            onClick={() => navigate("/rounds/new?scenario=first-round")}
            className="w-full sm:w-auto h-16 px-10 text-xl font-bold shadow-lg shadow-primary/30 gap-3"
          >
            <Play className="h-5 w-5 fill-current flex-shrink-0" aria-hidden="true" />
            Start my first round
          </Button>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-1">
            {TRUST_SIGNALS.map(({ icon, text }) => (
              <span
                key={text}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <span aria-hidden="true">{icon}</span>
                {text}
              </span>
            ))}
          </div>
        </div>

        {/* Skip link */}
        <button
          type="button"
          onClick={() => navigate("/practice")}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Skip the tour
        </button>
      </div>
    </div>
  );
};

export default FirstRoundEmptyState;
