
import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';

interface FeedbackDisplayProps {
  feedback: any;
  onSaveSummary: () => void;
  onPracticeSimilar: () => void;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  feedback,
  onSaveSummary,
  onPracticeSimilar
}) => {
  const { positiveOpening, improvementSuggestions, positiveClosing, progressMetrics } = feedback;
  
  return (
    <div className="space-y-6">
      {/* Positive Opening Section */}
      <Card className="p-6 border-l-4 border-green-500">
        <h3 className="text-xl font-semibold text-green-700">{positiveOpening.title}</h3>
        <ul className="mt-3 space-y-2">
          {positiveOpening.points.map((point, idx) => (
            <li key={idx} className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm font-medium text-gray-700">{positiveOpening.encouragement}</p>
      </Card>
      
      {/* Improvement Suggestions Section */}
      <Card className="p-6 border-l-4 border-amber-500">
        <h3 className="text-xl font-semibold text-amber-700">{improvementSuggestions.title}</h3>
        <ul className="mt-3 space-y-2">
          {improvementSuggestions.points.map((point, idx) => (
            <li key={idx} className="flex items-start">
              <span className="mr-2 text-amber-500">→</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h4 className="font-medium text-gray-900">Try this {improvementSuggestions.methodology.name} technique:</h4>
          <p className="mt-2 text-gray-700">{improvementSuggestions.methodology.technique}</p>
          <div className="mt-3 p-3 bg-white border border-gray-200 rounded">
            <p className="text-sm italic">"{improvementSuggestions.methodology.example}"</p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <h4 className="font-medium text-blue-900">Industry-Specific Tip:</h4>
          <p className="mt-1 text-blue-800">{improvementSuggestions.industryContext}</p>
        </div>
      </Card>
      
      {/* Positive Closing Section */}
      <Card className="p-6 border-l-4 border-purple-500">
        <h3 className="text-xl font-semibold text-purple-700">{positiveClosing.title}</h3>
        <ul className="mt-3 space-y-2">
          {positiveClosing.points.map((point, idx) => (
            <li key={idx} className="flex items-start">
              <span className="mr-2 text-purple-500">★</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm font-medium text-gray-700">{positiveClosing.nextStepSuggestion}</p>
      </Card>
      
      {/* Progress Metrics */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Your Improvement</h4>
          <span className="text-green-600 font-bold">{progressMetrics.improvement}%</span>
        </div>
        <Progress value={progressMetrics.improvement} className="h-2" />
        
        <div className="mt-6 flex gap-4">
          <Button onClick={onSaveSummary} className="flex-1">
            Save Summary Notes
          </Button>
          <Button onClick={onPracticeSimilar} variant="outline" className="flex-1">
            Practice Similar Objection
          </Button>
        </div>
      </div>
    </div>
  );
};
