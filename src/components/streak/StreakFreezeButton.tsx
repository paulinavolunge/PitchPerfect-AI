import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Snowflake } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StreakFreezeButtonProps {
  freezesAvailable: number;
  atRisk: boolean;
  onUseFreeze: () => Promise<boolean>;
}

const StreakFreezeButton: React.FC<StreakFreezeButtonProps> = ({
  freezesAvailable,
  atRisk,
  onUseFreeze,
}) => {
  const [isUsing, setIsUsing] = useState(false);
  const [used, setUsed] = useState(false);

  if (freezesAvailable <= 0 || used) return null;

  const handleUseFreeze = async () => {
    if (isUsing) return;
    setIsUsing(true);
    try {
      const ok = await onUseFreeze();
      if (ok) {
        setUsed(true);
        toast.success("❄️ Streak freeze used — your streak is safe for today.", {
          duration: 4000,
        });
      } else {
        toast.error("Couldn't apply freeze. You may have already used one today.");
      }
    } finally {
      setIsUsing(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={atRisk ? "default" : "outline"}
            size="sm"
            onClick={handleUseFreeze}
            disabled={isUsing}
            className={
              atRisk
                ? "gap-1.5 bg-sky-500 hover:bg-sky-600 text-white border-sky-500"
                : "gap-1.5 text-sky-600 border-sky-200 hover:border-sky-400"
            }
            aria-label={`Use streak freeze (${freezesAvailable} available)`}
          >
            <Snowflake
              className={`h-4 w-4 ${isUsing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {atRisk ? "Freeze streak" : `Freeze (${freezesAvailable})`}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-center">
          <p className="font-medium">Streak Freeze</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Protects your streak through one missed day.
            {freezesAvailable === 1
              ? " You have 1 freeze left this month."
              : ` You have ${freezesAvailable} freezes left this month.`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StreakFreezeButton;
