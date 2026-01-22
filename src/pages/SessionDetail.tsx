import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Target, MessageSquare, Lightbulb, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from '@/components/Navbar';

interface TranscriptMessage {
  id: string | number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface FeedbackData {
  overallScore?: number;
  responseAnalysis?: {
    tone?: { rating?: number; empathy?: string; confidence?: string; feedback?: string };
    clarity?: { rating?: number; specificity?: string; feedback?: string };
    objectionHandling?: { rating?: number; technique?: string; effectiveness?: string; feedback?: string };
  };
  improvements?: Array<{
    category?: string;
    description?: string;
    specificSuggestion?: string;
    priority?: string;
  }>;
  strengths?: string[];
  coachingTips?: {
    immediate?: string[];
    longTerm?: string[];
  };
  idealResponse?: {
    text?: string;
    explanation?: string;
  };
}

interface SessionData {
  id: string;
  created_at: string;
  scenario_type: string;
  industry: string;
  difficulty: string;
  duration_seconds: number;
  score: number | null;
  transcript: TranscriptMessage[] | null;
  feedback_data: FeedbackData | null;
}

const SessionDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId || !user?.id) {
        setError('Session not found');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('practice_sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching session:', fetchError);
          setError('Failed to load session');
        } else if (!data) {
          setError('Session not found');
        } else {
          // Parse the JSON fields
          const parsedSession: SessionData = {
            ...data,
            transcript: data.transcript as unknown as TranscriptMessage[] | null,
            feedback_data: data.feedback_data as unknown as FeedbackData | null,
          };
          setSession(parsedSession);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, user?.id]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 70) return 'default';
    if (score >= 50) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="ghost" 
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{error || 'Session not found'}</p>
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="mt-4"
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const feedback = session.feedback_data;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button 
          onClick={() => navigate('/dashboard')} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Session Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">
                  {session.scenario_type} Objection
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {session.industry} • {session.difficulty}
                </p>
              </div>
              {session.score !== null && session.score > 0 && (
                <Badge 
                  variant={getScoreBadgeVariant(session.score)}
                  className="text-lg px-4 py-2"
                >
                  Score: {session.score}%
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Duration: {formatDuration(session.duration_seconds)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Transcript */}
        {session.transcript && session.transcript.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {session.transcript.map((message, index) => (
                  <div 
                    key={message.id || index}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.sender === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {message.sender === 'user' ? 'You' : 'AI Client'}
                      </p>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Feedback */}
        {feedback && (
          <>
            {/* Response Analysis */}
            {feedback.responseAnalysis && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {feedback.responseAnalysis.tone && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-medium mb-2">Tone</h4>
                        <p className={`text-2xl font-bold ${getScoreColor(feedback.responseAnalysis.tone.rating || 0)}`}>
                          {feedback.responseAnalysis.tone.rating || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Empathy: {feedback.responseAnalysis.tone.empathy || 'N/A'}
                        </p>
                      </div>
                    )}
                    {feedback.responseAnalysis.clarity && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-medium mb-2">Clarity</h4>
                        <p className={`text-2xl font-bold ${getScoreColor(feedback.responseAnalysis.clarity.rating || 0)}`}>
                          {feedback.responseAnalysis.clarity.rating || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Specificity: {feedback.responseAnalysis.clarity.specificity || 'N/A'}
                        </p>
                      </div>
                    )}
                    {feedback.responseAnalysis.objectionHandling && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-medium mb-2">Objection Handling</h4>
                        <p className={`text-2xl font-bold ${getScoreColor(feedback.responseAnalysis.objectionHandling.rating || 0)}`}>
                          {feedback.responseAnalysis.objectionHandling.rating || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Technique: {feedback.responseAnalysis.objectionHandling.technique || 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Areas for Improvement */}
            {feedback.improvements && feedback.improvements.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feedback.improvements.map((improvement, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium capitalize">{improvement.category}</h4>
                          {improvement.priority && (
                            <Badge variant={improvement.priority === 'high' ? 'destructive' : 'secondary'}>
                              {improvement.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {improvement.description}
                        </p>
                        {improvement.specificSuggestion && (
                          <p className="text-sm bg-muted/50 p-2 rounded">
                            💡 {improvement.specificSuggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ideal Response */}
            {feedback.idealResponse?.text && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Ideal Response Example</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                    <p className="text-sm italic mb-3">"{feedback.idealResponse.text}"</p>
                    {feedback.idealResponse.explanation && (
                      <p className="text-xs text-muted-foreground">
                        {feedback.idealResponse.explanation}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Coaching Tips */}
            {feedback.coachingTips && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Coaching Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {feedback.coachingTips.immediate && feedback.coachingTips.immediate.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-sm">Immediate Actions</h4>
                        <ul className="space-y-2">
                          {feedback.coachingTips.immediate.map((tip, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-primary">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.coachingTips.longTerm && feedback.coachingTips.longTerm.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-sm">Long-term Goals</h4>
                        <ul className="space-y-2">
                          {feedback.coachingTips.longTerm.map((tip, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-primary">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* No Feedback Available */}
        {!feedback && !session.transcript && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No detailed feedback available for this session.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Back to Dashboard */}
        <div className="flex justify-center mt-8">
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
