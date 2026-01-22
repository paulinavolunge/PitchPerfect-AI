
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Target, Lightbulb } from 'lucide-react';

interface FeedbackData {
  score: number;
  tone: {
    rating: number;
    feedback: string;
  };
  clarity: {
    rating: number;
    feedback: string;
  };
  objectionHandling: {
    rating: number;
    feedback: string;
  };
  strengths: string[];
  improvements: string[];
  idealResponse: string;
}

interface FeedbackPanelProps {
  feedback: FeedbackData;
  isVisible: boolean;
  onClose: () => void;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ feedback, isVisible, onClose }) => {
  if (!isVisible) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, label: 'Excellent' };
    if (score >= 60) return { variant: 'secondary' as const, label: 'Good' };
    return { variant: 'destructive' as const, label: 'Needs Work' };
  };

  return (
    <Card className="mt-4 border-l-4 border-l-brand-blue">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-brand-blue" />
            Performance Feedback
          </CardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close feedback"
          >
            ×
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-semibold text-gray-900">Overall Score</h4>
            <p className="text-sm text-gray-600">Response effectiveness</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(feedback.score)}`}>
              {feedback.score}%
            </div>
            <Badge variant={getScoreBadge(feedback.score).variant}>
              {getScoreBadge(feedback.score).label}
            </Badge>
          </div>
        </div>

        {/* Detailed Ratings */}
        <div className="grid gap-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tone & Empathy</span>
              <span className="text-sm text-gray-600">{feedback.tone.rating}%</span>
            </div>
            <Progress value={feedback.tone.rating} className="h-2" />
            <p className="text-xs text-gray-600">{feedback.tone.feedback}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Clarity & Specificity</span>
              <span className="text-sm text-gray-600">{feedback.clarity.rating}%</span>
            </div>
            <Progress value={feedback.clarity.rating} className="h-2" />
            <p className="text-xs text-gray-600">{feedback.clarity.feedback}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Objection Handling</span>
              <span className="text-sm text-gray-600">{feedback.objectionHandling.rating}%</span>
            </div>
            <Progress value={feedback.objectionHandling.rating} className="h-2" />
            <p className="text-xs text-gray-600">{feedback.objectionHandling.feedback}</p>
          </div>
        </div>

        {/* Strengths */}
        {feedback.strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 font-semibold text-green-700">
              <CheckCircle className="h-4 w-4" />
              What You Did Well
            </h4>
            <ul className="space-y-1">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {feedback.improvements.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 font-semibold text-amber-700">
              <AlertCircle className="h-4 w-4" />
              Areas for Improvement
            </h4>
            <ul className="space-y-1">
              {feedback.improvements.map((improvement, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ideal Response */}
        {feedback.idealResponse && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 font-semibold text-blue-700">
              <Lightbulb className="h-4 w-4" />
              Sample Ideal Response
            </h4>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 italic">"{feedback.idealResponse}"</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackPanel;
