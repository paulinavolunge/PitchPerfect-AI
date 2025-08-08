import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Star,
  Zap,
  Eye
} from 'lucide-react';
import { DetailedFeedback } from '../../types/feedback';

interface EnhancedFeedbackDisplayProps {
  feedback: DetailedFeedback;
  objectionText: string;
  userResponse: string;
  isVisible: boolean;
  onClose: () => void;
}

const EnhancedFeedbackDisplay: React.FC<EnhancedFeedbackDisplayProps> = ({ 
  feedback, 
  objectionText, 
  userResponse, 
  isVisible, 
  onClose 
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    exchange: true,
    analysis: true,
    opportunities: false,
    ideal: false,
    coaching: false
  });

  if (!isVisible) return null;

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-500';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-emerald-600" />;
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: '✅ Strong' };
    if (score >= 60) return { color: 'bg-amber-100 text-amber-800 border-amber-200', label: '⚠️ Needs Work' };
    return { color: 'bg-red-100 text-red-800 border-red-200', label: '💡 Focus Area' };
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Response Analysis & Coaching</h2>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall Score & Progression */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getScoreIcon(feedback.overallScore)}
                  <div>
                    <CardTitle className="text-lg">Overall Performance</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {feedback.sessionProgression.confidenceProgression}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                    {feedback.overallScore}%
                  </div>
                  <Badge className={getScoreBadge(feedback.overallScore).color}>
                    {getScoreBadge(feedback.overallScore).label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Exchange Review */}
          <Collapsible open={openSections.exchange} onOpenChange={() => toggleSection('exchange')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-gray-600" />
                      <CardTitle className="text-base">Exchange #{feedback.sessionProgression.responseNumber}</CardTitle>
                    </div>
                    {openSections.exchange ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Customer Objection:</h4>
                      <p className="text-red-700 italic">"{objectionText}"</p>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Your Response:</h4>
                      <p className="text-blue-700">"{userResponse}"</p>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Detailed Analysis */}
          <Collapsible open={openSections.analysis} onOpenChange={() => toggleSection('analysis')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-gray-600" />
                      <CardTitle className="text-base">Detailed Performance Analysis</CardTitle>
                    </div>
                    {openSections.analysis ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {/* Tone Analysis */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Tone & Empathy
                      </h4>
                      <Badge className={getScoreBadge(feedback.responseAnalysis.tone.rating).color}>
                        {feedback.responseAnalysis.tone.rating}%
                      </Badge>
                    </div>
                    <div className="relative">
                      <Progress value={feedback.responseAnalysis.tone.rating} className="h-3" />
                      <div 
                        className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(feedback.responseAnalysis.tone.rating)}`}
                        style={{ width: `${feedback.responseAnalysis.tone.rating}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">{feedback.responseAnalysis.tone.feedback}</p>
                    {feedback.responseAnalysis.tone.suggestions.length > 0 && (
                      <ul className="text-sm space-y-1">
                        {feedback.responseAnalysis.tone.suggestions.map((suggestion: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-amber-700">
                            <span className="text-amber-500 mt-1">→</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Clarity Analysis */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-500" />
                        Clarity & Specificity
                      </h4>
                      <Badge className={getScoreBadge(feedback.responseAnalysis.clarity.rating).color}>
                        {feedback.responseAnalysis.clarity.rating}%
                      </Badge>
                    </div>
                    <div className="relative">
                      <Progress value={feedback.responseAnalysis.clarity.rating} className="h-3" />
                      <div 
                        className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(feedback.responseAnalysis.clarity.rating)}`}
                        style={{ width: `${feedback.responseAnalysis.clarity.rating}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">{feedback.responseAnalysis.clarity.feedback}</p>
                    {feedback.responseAnalysis.clarity.suggestions.length > 0 && (
                      <ul className="text-sm space-y-1">
                        {feedback.responseAnalysis.clarity.suggestions.map((suggestion: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-amber-700">
                            <span className="text-amber-500 mt-1">→</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Objection Handling */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-500" />
                        Objection Handling Technique
                      </h4>
                      <Badge className={getScoreBadge(feedback.responseAnalysis.objectionHandling.rating).color}>
                        {feedback.responseAnalysis.objectionHandling.rating}%
                      </Badge>
                    </div>
                    <div className="relative">
                      <Progress value={feedback.responseAnalysis.objectionHandling.rating} className="h-3" />
                      <div 
                        className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(feedback.responseAnalysis.objectionHandling.rating)}`}
                        style={{ width: `${feedback.responseAnalysis.objectionHandling.rating}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">{feedback.responseAnalysis.objectionHandling.feedback}</p>
                    {feedback.responseAnalysis.objectionHandling.suggestions.length > 0 && (
                      <ul className="text-sm space-y-1">
                        {feedback.responseAnalysis.objectionHandling.suggestions.map((suggestion: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-amber-700">
                            <span className="text-amber-500 mt-1">→</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    {feedback.strengths.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2 text-emerald-700">
                          <CheckCircle className="h-4 w-4" />
                          What You Did Well
                        </h4>
                        <div className="space-y-2">
                          {feedback.strengths.map((strength: any, idx: number) => (
                            <div key={idx} className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                              <p className="text-sm text-emerald-800 font-medium">{strength.description}</p>
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {strength.impact} impact
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {feedback.improvements.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2 text-amber-700">
                          <AlertTriangle className="h-4 w-4" />
                          Key Improvements
                        </h4>
                        <div className="space-y-2">
                          {feedback.improvements.map((improvement: any, idx: number) => (
                            <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded">
                              <p className="text-sm text-amber-800 font-medium">{improvement.description}</p>
                              <p className="text-xs text-amber-700 mt-1">{improvement.specificSuggestion}</p>
                              <div className="mt-2 p-2 bg-white border border-amber-300 rounded text-xs italic text-amber-800">
                                Example: "{improvement.example}"
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Missed Opportunities */}
          {feedback.missedOpportunities.length > 0 && (
            <Collapsible open={openSections.opportunities} onOpenChange={() => toggleSection('opportunities')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lightbulb className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-base">Missed Opportunities</CardTitle>
                      </div>
                      {openSections.opportunities ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-4">
                      {feedback.missedOpportunities.map((opportunity: any, idx: number) => (
                        <div key={idx} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <h4 className="font-medium text-orange-800 mb-2">{opportunity.description}</h4>
                          <p className="text-sm text-orange-700 mb-3">{opportunity.betterApproach}</p>
                          <div className="p-3 bg-white border border-orange-300 rounded text-sm italic text-orange-800">
                            Try this: "{opportunity.example}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Ideal Response */}
          <Collapsible open={openSections.ideal} onOpenChange={() => toggleSection('ideal')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-purple-500" />
                      <CardTitle className="text-base">Sample Ideal Response</CardTitle>
                    </div>
                    {openSections.ideal ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-purple-800 italic text-sm leading-relaxed">
                      "{feedback.idealResponse.text}"
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Why This Works:</h4>
                    <p className="text-sm text-gray-600">{feedback.idealResponse.explanation}</p>
                    <div className="flex flex-wrap gap-2">
                      {feedback.idealResponse.keyTechniques.map((technique: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {technique}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Coaching Tips */}
          <Collapsible open={openSections.coaching} onOpenChange={() => toggleSection('coaching')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-base">Personal Coaching Tips</CardTitle>
                    </div>
                    {openSections.coaching ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-800">Focus Now</h4>
                      <ul className="space-y-2">
                        {feedback.coachingTips.immediate.map((tip: string, idx: number) => (
                          <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-green-800">Practice Long-term</h4>
                      <ul className="space-y-2">
                        {feedback.coachingTips.longTerm.map((tip: string, idx: number) => (
                          <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Session Summary */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Session Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Progression: <span className="font-medium text-gray-900">{feedback.sessionProgression.improvementTrend}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Next focus: Work on your top improvement areas above
                  </p>
                </div>
                <div className="text-right">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={onClose} aria-label="Continue practicing and close feedback">
                    Continue Practicing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFeedbackDisplay;