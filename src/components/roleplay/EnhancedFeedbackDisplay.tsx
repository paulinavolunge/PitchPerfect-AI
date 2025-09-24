import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle, 
  Wrench, 
  Rocket, 
  Target, 
  TrendingUp, 
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Star,
  Lightbulb,
  Copy,
  Trophy,
  Zap
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
    strengths: true,
    quickFix: true,
    growthPath: false,
    actionPlan: true,
    nextOpportunities: false
  });

  const [copiedPrompt, setCopiedPrompt] = useState<string>('');

  if (!isVisible) return null;

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getProgressLevel = (score: number) => {
    if (score >= 80) return { level: 'Expert', color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-200' };
    if (score >= 60) return { level: 'Growing', color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-200' };
    return { level: 'Learning', color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-200' };
  };

  const getXPPoints = (score: number) => {
    return Math.max(10, Math.floor(score * 0.5));
  };

  const copyToClipboard = async (text: string, promptType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(promptType);
      setTimeout(() => setCopiedPrompt(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const progressLevel = getProgressLevel(feedback.overallScore);
  const xpPoints = getXPPoints(feedback.overallScore);

  // Sample micro-prompts for quick copy
  const microPrompts = [
    {
      label: "Acknowledge Budget Concern",
      text: "I completely understand why budget is a key factor for you..."
    },
    {
      label: "Value Example",
      text: "For example, our client reduced costs by 40% in 3 months."
    },
    {
      label: "Empathy Bridge",
      text: "I hear that this is really important to your team's success..."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Your Growth Report</h2>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Growth Score & XP */}
          <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${progressLevel.bgColor}`}>
                    <Trophy className={`h-6 w-6 ${progressLevel.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">You're {progressLevel.level}! 🎉</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feedback.sessionProgression.confidenceProgression}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${progressLevel.color}`}>
                    +{xpPoints} XP
                  </div>
                  <Badge className={`${progressLevel.bgColor} ${progressLevel.color} ${progressLevel.borderColor}`}>
                    Level: {progressLevel.level}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Exchange Review */}
          <Collapsible open={openSections.exchange} onOpenChange={() => toggleSection('exchange')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Practice Round #{feedback.sessionProgression.responseNumber}</CardTitle>
                    </div>
                    {openSections.exchange ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">Customer Challenge:</h4>
                      <p className="text-orange-700 italic">"{objectionText}"</p>
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

          {/* ✅ What You Did Well */}
          <Collapsible open={openSections.strengths} onOpenChange={() => toggleSection('strengths')}>
            <Card className="border-emerald-200">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-base text-emerald-700">✅ What You Did Well</CardTitle>
                    </div>
                    {openSections.strengths ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {feedback.strengths.length > 0 ? (
                    <div className="space-y-3">
                      {feedback.strengths.map((strength: any, idx: number) => (
                        <div key={idx} className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Star className="h-5 w-5 text-emerald-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-emerald-800 font-medium">{strength.description}</p>
                              <Badge variant="secondary" className="mt-2 text-xs bg-emerald-100 text-emerald-700">
                                {strength.impact} impact
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-emerald-800">Great job getting started! Every expert began with their first practice round. 🌱</p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* 🔧 Next Quick Fix */}
          <Collapsible open={openSections.quickFix} onOpenChange={() => toggleSection('quickFix')}>
            <Card className="border-blue-200">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base text-blue-700">🔧 Next Quick Fix</CardTitle>
                    </div>
                    {openSections.quickFix ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {feedback.improvements.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-blue-800 font-medium mb-2">
                            Focus on: {feedback.improvements[0].description}
                          </p>
                          <p className="text-blue-700 text-sm mb-3">
                            {feedback.improvements[0].specificSuggestion}
                          </p>
                          <div className="p-3 bg-white border border-blue-300 rounded text-sm">
                            <p className="text-blue-800 font-medium mb-1">Try this approach:</p>
                            <p className="text-blue-700 italic">"{feedback.improvements[0].example}"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* 🚀 Growth Path */}
          <Collapsible open={openSections.growthPath} onOpenChange={() => toggleSection('growthPath')}>
            <Card className="border-purple-200">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Rocket className="h-5 w-5 text-purple-600" />
                      <CardTitle className="text-base text-purple-700">🚀 Growth Path (Acknowledge → Reframe → Engage)</CardTitle>
                    </div>
                    {openSections.growthPath ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {/* Acknowledge */}
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">1. Acknowledge</h4>
                      <p className="text-purple-700 text-sm mb-2">Show empathy for their concern</p>
                      <div className="p-3 bg-white border border-purple-300 rounded">
                        <p className="text-purple-800 text-xs italic">"{microPrompts[0].text}"</p>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="mt-2 h-6 text-xs"
                          onClick={() => copyToClipboard(microPrompts[0].text, 'acknowledge')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copiedPrompt === 'acknowledge' ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>

                    {/* Reframe */}
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">2. Reframe</h4>
                      <p className="text-purple-700 text-sm mb-2">Shift perspective with value focus</p>
                      <div className="p-3 bg-white border border-purple-300 rounded">
                        <p className="text-purple-800 text-xs italic">"{microPrompts[1].text}"</p>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="mt-2 h-6 text-xs"
                          onClick={() => copyToClipboard(microPrompts[1].text, 'reframe')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copiedPrompt === 'reframe' ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>

                    {/* Engage */}
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">3. Engage</h4>
                      <p className="text-purple-700 text-sm mb-2">Ask questions to move forward</p>
                      <div className="p-3 bg-white border border-purple-300 rounded">
                        <p className="text-purple-800 text-xs italic">"{microPrompts[2].text}"</p>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="mt-2 h-6 text-xs"
                          onClick={() => copyToClipboard(microPrompts[2].text, 'engage')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copiedPrompt === 'engage' ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* 🎯 Action Plan */}
          <Collapsible open={openSections.actionPlan} onOpenChange={() => toggleSection('actionPlan')}>
            <Card className="border-primary/30">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">🎯 Action Plan</CardTitle>
                    </div>
                    {openSections.actionPlan ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium text-primary mb-3">Apply these 3 steps in your next conversation:</h4>
                    <div className="space-y-3">
                      {feedback.coachingTips.immediate.slice(0, 3).map((tip: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                            {idx + 1}
                          </div>
                          <p className="text-sm text-primary/80">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Next Opportunities (formerly Missed Opportunities) */}
          {feedback.missedOpportunities.length > 0 && (
            <Collapsible open={openSections.nextOpportunities} onOpenChange={() => toggleSection('nextOpportunities')}>
              <Card className="border-orange-200">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lightbulb className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-base text-orange-700">💡 Next Opportunities</CardTitle>
                      </div>
                      {openSections.nextOpportunities ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-4">
                      {feedback.missedOpportunities.map((opportunity: any, idx: number) => (
                        <div key={idx} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <h4 className="font-medium text-orange-800 mb-2">🌟 Next time, try this:</h4>
                          <p className="text-orange-700 text-sm mb-3">{opportunity.betterApproach}</p>
                          <div className="p-3 bg-white border border-orange-300 rounded">
                            <p className="text-orange-800 text-xs font-medium mb-1">Example approach:</p>
                            <p className="text-orange-700 text-sm italic">"{opportunity.example}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Growth Summary */}
          <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                👏 You're Growing!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">Progress:</span> {feedback.sessionProgression.improvementTrend}
                  </p>
                  <p className="text-sm text-emerald-700 font-medium">
                    You're showing steady growth — let's sharpen your technique next time! 🚀
                  </p>
                </div>
                <div className="text-right">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onClose}>
                    Keep Practicing!
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