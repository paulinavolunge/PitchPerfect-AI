// Type definitions for feedback objects used across components

export interface CallData {
  id: string;
  title: string;
  date: string;
  duration: string;
  score: number;
  transcript?: string;
  categories?: {
    clarity: number;
    confidence: number;
    handling: number;
    vocabulary: number;
  };
  topStrength?: string;
  topImprovement?: string;
}

export interface FeedbackAnalysis {
  rating: number;
  feedback: string;
  suggestions: string[];
}

export interface DetailedFeedback {
  overallScore: number;
  sessionProgression: {
    responseNumber: number;
    confidenceProgression: string;
    improvementTrend: string;
  };
  responseAnalysis: {
    tone: FeedbackAnalysis;
    clarity: FeedbackAnalysis;
    objectionHandling: FeedbackAnalysis;
  };
  strengths: Array<{
    description: string;
    impact: string;
  }>;
  improvements: Array<{
    description: string;
    specificSuggestion: string;
    example: string;
  }>;
  missedOpportunities: Array<{
    description: string;
    betterApproach: string;
    example: string;
  }>;
  idealResponse: {
    text: string;
    explanation: string;
    keyTechniques: string[];
  };
  coachingTips: {
    immediate: string[];
    longTerm: string[];
  };
}

export interface SimpleFeedback {
  positiveOpening: {
    title: string;
    points: string[];
    encouragement: string;
  };
  improvementSuggestions: {
    title: string;
    points: string[];
    methodology: {
      name: string;
      technique: string;
      example: string;
    };
    industryContext: string;
  };
  positiveClosing: {
    title: string;
    points: string[];
    nextStepSuggestion: string;
  };
  progressMetrics: {
    improvement: number;
  };
}