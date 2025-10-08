import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileAudio, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RecentSession } from '@/hooks/use-dashboard-data';
import { formatDistanceToNow } from 'date-fns';

interface RecentSessionsProps {
  sessions: RecentSession[];
  onStartPractice: () => void;
}

const RecentSessions: React.FC<RecentSessionsProps> = ({ sessions, onStartPractice }) => {
  const navigate = useNavigate();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (sessions.length === 0) {
    return (
      <Card className="overflow-hidden shadow-md">
        <CardHeader className="bg-gradient-to-r from-brand-blue/10 to-brand-blue/5 pb-4">
          <CardTitle className="text-xl text-brand-dark">Recent Practice Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <FileAudio className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No practice sessions yet.</p>
            <p className="text-gray-400 text-sm mb-6">Start your first practice to see your progress here.</p>
            <Button 
              onClick={onStartPractice}
              className="bg-brand-green hover:bg-brand-green/90"
            >
              Start First Practice
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
          Recent Practice Sessions
          <span className="text-sm font-normal text-gray-500">
            Last {sessions.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => navigate(`/practice/${session.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-brand-dark mb-1">
                    {session.scenario}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(session.duration)}
                    </span>
                    <span className="text-xs">
                      {formatDistanceToNow(new Date(session.date), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                {session.score !== null && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`h-4 w-4 ${
                      session.score >= 70 ? 'text-green-600' : 
                      session.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                    <span className={`text-lg font-semibold ${
                      session.score >= 70 ? 'text-green-600' : 
                      session.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {session.score}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <Button
            onClick={() => navigate('/practice')}
            variant="outline"
            className="w-full"
          >
            View All Sessions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentSessions;
