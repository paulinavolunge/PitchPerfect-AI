import React from 'react';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

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
  percentile?: number | null; // Make percentile optional
  sessionCount?: number; // Add session count field
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
    improvements,
    percentile,
    sessionCount = 0 // Default to 0 if not provided
  } = scoreData;
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-amber-500';
    return 'text-red-500';
  };
  
  // Render the percentile badge based on the session count
  const renderPercentileBadge = () => {
    // If there are fewer than 20 sessions or percentile is null/undefined, show "Great start!"
    if (sessionCount < 20 || percentile === null || percentile === undefined) {
      return (
        <Badge variant="secondary" className="ml-2 bg-brand-blue/20 text-brand-blue">
          <TrendingUp className="h-3 w-3 mr-1" /> Great start!
        </Badge>
      );
    }
    
    // Otherwise show the actual percentile
    return (
      <Badge variant="secondary" className="ml-2 bg-brand-blue/20 text-brand-blue">
        <TrendingUp className="h-3 w-3 mr-1" /> Top {percentile}%
      </Badge>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="text-center sm:text-left mb-4 sm:mb-0">
          <div className="flex items-center">
            <h3 className="text-sm font-medium text-brand-dark/60">OVERALL SCORE</h3>
            {renderPercentileBadge()}
          </div>
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
