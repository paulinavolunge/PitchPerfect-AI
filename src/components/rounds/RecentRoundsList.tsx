import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileAudio, Clock, TrendingUp, RotateCcw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format, isToday, isYesterday, subHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import IncompleteRoundRow from './IncompleteRoundRow';

interface Round {
  id: string;
  created_at: string;
  scenario_type: string;
  difficulty: string;
  score: number | null;
  duration_seconds: number;
  status: string;
  reason: string | null;
}

interface RecentRoundsListProps {
  onStartPractice: () => void;
}

const formatDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  const time = format(d, 'h:mm a');
  if (isToday(d)) return `Today ${time}`;
  if (isYesterday(d)) return `Yesterday`;
  return format(d, 'MMM d');
};

function scoreColor(score: number) {
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

// ── Swipeable row (mobile) ───────────────────────────────────────────────────
const REVEAL_WIDTH = 128; // px — width of the two action buttons combined
const SNAP_THRESHOLD = 50; // px swipe to snap open

interface SwipeableRoundRowProps {
  round: Round;
  onTap: () => void;
  onRetry: () => void;
  onDelete: () => void;
}

const SwipeableRoundRow: React.FC<SwipeableRoundRowProps> = ({ round, onTap, onRetry, onDelete }) => {
  const startXRef = useRef<number | null>(null);
  const currentXRef = useRef<number>(0);
  const [translateX, setTranslateX] = useState(0);
  const isOpen = translateX <= -SNAP_THRESHOLD;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const diff = e.touches[0].clientX - startXRef.current;
    if (diff > 5) { setTranslateX(0); return; } // ignore right swipe
    const clamped = Math.max(-REVEAL_WIDTH, Math.min(0, diff));
    currentXRef.current = clamped;
    setTranslateX(clamped);
  };

  const handleTouchEnd = () => {
    const snapped = currentXRef.current <= -SNAP_THRESHOLD ? -REVEAL_WIDTH : 0;
    setTranslateX(snapped);
    startXRef.current = null;
  };

  const handleTap = () => {
    if (isOpen) { setTranslateX(0); return; }
    onTap();
  };

  return (
    <div className="relative overflow-hidden" role="listitem">
      {/* Hidden action buttons — revealed by swipe */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-stretch"
        aria-hidden={!isOpen}
        style={{ width: REVEAL_WIDTH }}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setTranslateX(0); onRetry(); }}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-blue-500 text-white text-xs font-semibold min-w-[64px] min-h-[44px]"
          aria-label={`Retry ${round.scenario_type} scenario`}
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setTranslateX(0); onDelete(); }}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-red-500 text-white text-xs font-semibold min-w-[64px] min-h-[44px]"
          aria-label={`Delete this round`}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {/* Row content — translates left to expose actions */}
      <div
        className="relative bg-card"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: startXRef.current === null ? 'transform 0.2s ease-out' : 'none',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        <div className="px-4 py-3.5 flex items-center justify-between min-h-[56px] cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100">
          <div className="flex-1 min-w-0 pr-3">
            <p className="font-medium text-sm text-foreground truncate capitalize">
              {round.scenario_type.replace(/_/g, ' ')}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3 flex-shrink-0" />
                {formatDuration(round.duration_seconds)}
              </span>
              <span>·</span>
              <span>{formatDate(round.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {round.score !== null && round.score > 0 ? (
              <>
                <TrendingUp className={cn("h-3.5 w-3.5", scoreColor(round.score))} />
                <span className={cn("text-base font-bold", scoreColor(round.score))}>
                  {round.score}%
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-400">--</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── RecentRoundsList ─────────────────────────────────────────────────────────
const RecentRoundsList: React.FC<RecentRoundsListProps> = ({ onStartPractice }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scoredRounds, setScoredRounds] = useState<Round[]>([]);
  const [incompleteRounds, setIncompleteRounds] = useState<Round[]>([]);
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRounds = useCallback(async () => {
    if (!user?.id) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const cutoff24h = subHours(new Date(), 24).toISOString();
      const [{ data: scored }, { data: incomplete }] = await Promise.all([
        supabase
          .from('practice_sessions')
          .select('id, created_at, scenario_type, difficulty, score, duration_seconds, status, reason')
          .eq('user_id', user.id)
          .eq('status', 'scored')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('practice_sessions')
          .select('id, created_at, scenario_type, difficulty, score, duration_seconds, status, reason')
          .eq('user_id', user.id)
          .in('status', ['incomplete', 'failed'])
          .gte('created_at', cutoff24h)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);
      setScoredRounds(scored ?? []);
      setIncompleteRounds(incomplete ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchRounds(); }, [fetchRounds]);

  const handleRetry = useCallback((scenarioId: string) => {
    navigate(`/practice?scenario=${encodeURIComponent(scenarioId)}`);
  }, [navigate]);

  const handleDelete = useCallback(async (roundId: string) => {
    setScoredRounds((prev) => prev.filter((r) => r.id !== roundId));
    const { error } = await supabase
      .from('practice_sessions')
      .delete()
      .eq('id', roundId);
    if (error) {
      toast.error('Could not delete round — please try again.');
      fetchRounds(); // restore on error
    } else {
      toast.success('Round deleted.');
    }
  }, [fetchRounds]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Rounds</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-px">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse bg-muted/50 mx-0" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (scoredRounds.length === 0 && incompleteRounds.length === 0) {
    return (
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="py-10 text-center">
          <FileAudio className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No rounds yet — your history appears here.</p>
          <Button onClick={onStartPractice} size="sm" className="min-h-[44px]">
            Start First Round
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Recent Rounds</CardTitle>
        {scoredRounds.length > 0 && (
          <span className="text-xs text-muted-foreground">Swipe left to act</span>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {/* Scored rounds — swipeable on mobile */}
        <div className="divide-y divide-border" role="list">
          {scoredRounds.map((round) => (
            <SwipeableRoundRow
              key={round.id}
              round={round}
              onTap={() => navigate(`/practice/${round.id}`)}
              onRetry={() => handleRetry(round.scenario_type)}
              onDelete={() => handleDelete(round.id)}
            />
          ))}
        </div>

        {/* Incomplete toggle */}
        {incompleteRounds.length > 0 && (
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => setShowIncomplete((v) => !v)}
              className="w-full px-4 flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors min-h-[44px]"
            >
              <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
              {showIncomplete ? 'Hide' : 'Show'} incomplete ({incompleteRounds.length})
            </button>
            {showIncomplete && (
              <div className="divide-y divide-border bg-red-50/30">
                {incompleteRounds.map((round) => (
                  <IncompleteRoundRow
                    key={round.id}
                    id={round.id}
                    date={round.created_at}
                    scenario={`${round.scenario_type} (${round.difficulty})`}
                    scenarioId={round.scenario_type}
                    duration={round.duration_seconds}
                    reason={round.reason}
                    onRetry={handleRetry}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-3 border-t border-border">
          <Button
            onClick={() => navigate('/practice')}
            variant="outline"
            className="w-full min-h-[44px] text-sm"
          >
            View All Rounds
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentRoundsList;
