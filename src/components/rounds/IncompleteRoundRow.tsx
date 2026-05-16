import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, Info } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

const REASON_LABELS: Record<string, string> = {
  too_short: 'Too short',
  no_speech_detected: 'No speech detected',
  hallucinated_output: 'No speech detected',
  empty_transcript: 'No speech detected',
  processing_failed: 'Processing failed',
};

interface IncompleteRoundRowProps {
  id: string;
  date: string;
  scenario: string;
  scenarioId?: string;
  duration: number;
  reason?: string | null;
  onRetry?: (scenarioId: string) => void;
}

const IncompleteRoundRow: React.FC<IncompleteRoundRowProps> = ({
  date,
  scenario,
  scenarioId,
  duration,
  reason,
  onRetry,
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const reasonLabel = reason ? (REASON_LABELS[reason] ?? 'Processing failed') : 'Processing failed';

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const time = format(d, 'h:mm a');
    if (isToday(d)) return `Today at ${time}`;
    if (isYesterday(d)) return `Yesterday at ${time}`;
    return `${format(d, 'MMM d')} at ${time}`;
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRetry && scenarioId) onRetry(scenarioId);
  };

  return (
    <div className="p-4 flex items-center justify-between gap-3">
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-red-500" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-gray-500 truncate">{scenario}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">{formatDate(date)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-red-500 font-medium">Recording incomplete</span>
            {/* Reason tooltip — hover on desktop, tap on mobile */}
            <div className="relative inline-flex">
              <button
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                onMouseEnter={() => setTooltipVisible(true)}
                onMouseLeave={() => setTooltipVisible(false)}
                onFocus={() => setTooltipVisible(true)}
                onBlur={() => setTooltipVisible(false)}
                onClick={(e) => { e.stopPropagation(); setTooltipVisible((v) => !v); }}
                aria-label={`Reason: ${reasonLabel}`}
                type="button"
              >
                <Info className="h-3 w-3" />
              </button>
              {tooltipVisible && (
                <div
                  role="tooltip"
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg pointer-events-none"
                >
                  {reasonLabel}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
              )}
            </div>
            {duration > 0 && (
              <>
                <span className="text-xs text-gray-300">•</span>
                <span className="flex items-center gap-0.5 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {formatDuration(duration)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleRetry}
        className="flex-shrink-0 h-7 px-2 gap-1 text-xs"
        type="button"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </Button>
    </div>
  );
};

export default IncompleteRoundRow;
