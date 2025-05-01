
import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ScoreData {
  overallScore: number;
  categories: {
    clarity: number;
    confidence: number;
    handling: number;
    vocabulary: number;
  };
  transcript: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface DemoScorecardProps {
  scoreData: ScoreData;
}

const DemoScorecard: React.FC<DemoScorecardProps> = ({ scoreData }) => {
  const {
    overallScore,
    categories,
    feedback,
    strengths,
    improvements
  } = scoreData;
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-amber-500';
    return 'text-red-500';
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="text-center sm:text-left mb-4 sm:mb-0">
          <h3 className="text-sm font-medium text-brand-dark/60">OVERALL SCORE</h3>
          <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}/10
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <h4 className="text-sm font-medium text-brand-dark/60">CLARITY</h4>
            <div className={`text-xl font-semibold ${getScoreColor(categories.clarity)}`}>
              {categories.clarity}/10
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="text-sm font-medium text-brand-dark/60">CONFIDENCE</h4>
            <div className={`text-xl font-semibold ${getScoreColor(categories.confidence)}`}>
              {categories.confidence}/10
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="text-sm font-medium text-brand-dark/60">OBJECTION HANDLING</h4>
            <div className={`text-xl font-semibold ${getScoreColor(categories.handling)}`}>
              {categories.handling}/10
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="text-sm font-medium text-brand-dark/60">VOCABULARY</h4>
            <div className={`text-xl font-semibold ${getScoreColor(categories.vocabulary)}`}>
              {categories.vocabulary}/10
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="font-medium text-brand-dark mb-2">Feedback</h3>
        <p className="text-brand-dark/80">{feedback}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-700 flex items-center gap-2 mb-2">
            <CheckCircle size={18} /> Strengths
          </h3>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li key={index} className="text-brand-dark/80">• {strength}</li>
            ))}
          </ul>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg">
          <h3 className="font-medium text-amber-700 flex items-center gap-2 mb-2">
            <AlertCircle size={18} /> Areas to Improve
          </h3>
          <ul className="space-y-2">
            {improvements.map((improvement, index) => (
              <li key={index} className="text-brand-dark/80">• {improvement}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DemoScorecard;
