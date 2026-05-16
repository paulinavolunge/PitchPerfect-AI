import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileAudio, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format, isToday, isYesterday, subHours } from 'date-fns';
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
  if (isToday(d)) return `Today at ${time}`;
  if (isYesterday(d)) return `Yesterday at ${time}`;
  return `${format(d, 'MMM d')} at ${time}`;
};

const RecentRoundsList: React.FC<RecentRoundsListProps> = ({ onStartPractice }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scoredRounds, setScoredRounds] = useState<Round[]>([]);
  const [incompleteRounds, setIncompleteRounds] = useState<Round[]>([]);
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRounds = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Incomplete/failed rounds auto-hide after 24h (Loom pattern)
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

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const handleRetry = useCallback((scenarioId: string) => {
    navigate(`/practice?scenario=${encodeURIComponent(scenarioId)}`);
  }, [navigate]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden shadow-md">
        <CardHeader className="bg-gradient-to-r from-brand-blue/10 to-brand-blue/5 pb-4">
          <CardTitle className="text-xl text-brand-dark">Recent Rounds</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded bg-gray-100" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (scoredRounds.length === 0 && incompleteRounds.length === 0) {
    return (
      <Card className="overflow-hidden shadow-md">
        <CardHeader className="bg-gradient-to-r from-brand-blue/10 to-brand-blue/5 pb-4">
          <CardTitle className="text-xl text-brand-dark">Recent Rounds</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <FileAudio className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No rounds yet.</p>
            <p className="text-gray-400 text-sm mb-6">Start your first round to see your progress here.</p>
            <Button onClick={onStartPractice} className="bg-brand-green hover:bg-brand-green/90">
              Start First Round
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-md">
      <CardHeader className="bg-gradient-to-r from-brand-blue/10 to-brand-blue/5 pb-4">
        <CardTitle className="text-xl text-brand-dark flex items-center justify-between">
          Recent Rounds
          <span className="text-sm font-normal text-gray-500">Last {scoredRounds.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Scored rounds — default view */}
        <div className="divide-y divide-gray-100">
          {scoredRounds.map((round) => (
            <div
              key={round.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => navigate(`/practice/${round.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-brand-dark">
                      {round.scenario_type} ({round.difficulty})
                    </h4>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{formatDate(round.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(round.duration_seconds)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {round.score !== null && round.score > 0 ? (
                    <>
                      <TrendingUp
                        className={`h-4 w-4 ${
                          round.score >= 70
                            ? 'text-green-600'
                            : round.score >= 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      />
                      <span
                        className={`text-lg font-semibold ${
                          round.score >= 70
                            ? 'text-green-600'
                            : round.score >= 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {round.score}%
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">--</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Incomplete toggle — only shown when incomplete rows exist within 24h */}
        {incompleteRounds.length > 0 && (
          <div className="border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowIncomplete((v) => !v)}
              className="w-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
              {showIncomplete ? 'Hide' : 'Show'} incomplete ({incompleteRounds.length})
            </button>

            {showIncomplete && (
              <div className="divide-y divide-gray-100 bg-red-50/30">
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

        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <Button onClick={() => navigate('/practice')} variant="outline" className="w-full">
            View All Rounds
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentRoundsList;
