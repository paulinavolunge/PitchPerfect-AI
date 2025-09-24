import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Zap,
  Sparkles,
  Award,
  ArrowUp
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
    exchange: false,
    quickFix: true,
    actionPlan: true,
  });

  const [copiedPrompt, setCopiedPrompt] = useState<string>('');

  if (!isVisible) return null;

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getSkillStage = (score: number) => {
    if (score >= 80) return { 
      stage: 'Pro', 
      icon: '🌳', 
      color: 'text-emerald-600', 
      bgGradient: 'bg-gradient-to-br from-emerald-50 to-green-100', 
      borderColor: 'border-emerald-200',
      ringColor: 'ring-emerald-500/20',
      celebration: 'Master Level Achieved! 🏆'
    };
    if (score >= 60) return { 
      stage: 'Builder', 
      icon: '🌿', 
      color: 'text-blue-600', 
      bgGradient: 'bg-gradient-to-br from-blue-50 to-cyan-100', 
      borderColor: 'border-blue-200',
      ringColor: 'ring-blue-500/20',
      celebration: 'Strong Foundation Built! 💪'
    };
    if (score >= 40) return { 
      stage: 'Growing', 
      icon: '🌱', 
      color: 'text-green-600', 
      bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-100', 
      borderColor: 'border-green-200',
      ringColor: 'ring-green-500/20',
      celebration: 'Great Progress Made! 🚀'
    };
    return { 
      stage: 'Foundation', 
      icon: '🌰', 
      color: 'text-orange-600', 
      bgGradient: 'bg-gradient-to-br from-orange-50 to-amber-100', 
      borderColor: 'border-orange-200',
      ringColor: 'ring-orange-500/20',
      celebration: 'Perfect Starting Point! ✨'
    };
  };

  const getSkillXP = (score: number, skillName: string) => {
    const xp = Math.max(5, Math.floor(score * 0.6) + Math.random() * 10);
    return Math.floor(xp);
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

  const skillStage = getSkillStage(feedback.overallScore);
  const totalXP = getSkillXP(feedback.overallScore, 'overall');

  // Enhanced micro-prompts with context
  const contextualPrompts = [
    {
      label: "Empathy Bridge",
      text: "I completely understand why budget is a key factor for you - it shows you're being thoughtful about your investment.",
      category: "Acknowledge"
    },
    {
      label: "Value Pivot",
      text: "Let me share how our client in a similar situation reduced their costs by 40% in the first quarter.",
      category: "Reframe"
    },
    {
      label: "Forward Movement", 
      text: "What would need to be true about the ROI for this to make sense within your budget?",
      category: "Engage"
    }
  ];

  // Find the most positive thing to lead with
  const leadingStrength = feedback.strengths.length > 0 
    ? feedback.strengths[0].description 
    : "You engaged with the objection - that's the first step to mastering this skill!";

  const topImprovement = feedback.improvements.length > 0 
    ? feedback.improvements[0] 
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-0">
        {/* Header - Celebration First */}
        <div className={`${skillStage.bgGradient} border-b px-6 py-4 rounded-t-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-white/80 rounded-full ${skillStage.ringColor} ring-4`}>
                <Trophy className={`h-6 w-6 ${skillStage.color}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  {skillStage.icon} {skillStage.celebration}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  +{totalXP} XP earned • {skillStage.stage} level unlocked
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose} className="bg-white/80 hover:bg-white">
              Continue
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Quick Wins Section - What you did well */}
          <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                <CheckCircle className="h-5 w-5" />
                ✅ What You Nailed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-emerald-200/50">
                <Star className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-emerald-800 font-medium">{leadingStrength}</p>
              </div>
              {feedback.strengths.slice(1, 3).map((strength: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 mt-2 text-sm text-emerald-700">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span>{strength.description}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* One Key Focus - Quick Fix */}
          {topImprovement && (
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                  <Wrench className="h-5 w-5" />
                  🔧 One Quick Level-Up
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-white/60 rounded-lg border border-blue-200/50">
                  <div className="flex items-start gap-3">
                    <ArrowUp className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-blue-800 mb-2">
                        Next time: {topImprovement.specificSuggestion}
                      </p>
                      <div className="p-3 bg-blue-100/50 rounded border border-blue-200">
                        <p className="text-xs text-blue-700 font-medium mb-1">Try this:</p>
                        <p className="text-sm text-blue-800 italic">"{topImprovement.example}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Plan - 3 Quick Steps */}
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                <Target className="h-5 w-5" />
                🎯 Your 3-Step Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {contextualPrompts.map((prompt, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-purple-200/50">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-purple-800 text-sm">{prompt.category}</p>
                        <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                          {prompt.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-purple-700 mb-2">"{prompt.text}"</p>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-xs hover:bg-purple-100"
                        onClick={() => copyToClipboard(prompt.text, `step-${idx}`)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copiedPrompt === `step-${idx}` ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skill Progress - Gamified */}
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                <Award className="h-5 w-5" />
                📈 Skill Tree Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { skill: 'Empathy', score: feedback.responseAnalysis.tone.rating, icon: '❤️' },
                  { skill: 'Clarity', score: feedback.responseAnalysis.clarity.rating, icon: '💡' },
                  { skill: 'Technique', score: feedback.responseAnalysis.objectionHandling.rating, icon: '🎯' }
                ].map((skill, idx) => {
                  const xp = getSkillXP(skill.score, skill.skill.toLowerCase());
                  const stage = getSkillStage(skill.score);
                  return (
                    <div key={idx} className="text-center p-3 bg-white/60 rounded-lg border border-orange-200/50">
                      <div className="text-2xl mb-1">{skill.icon}</div>
                      <p className="font-medium text-orange-800 text-sm">{skill.skill}</p>
                      <p className="text-xs text-orange-700">+{xp} XP</p>
                      <div className="mt-1 text-xs">
                        <span className={`${stage.color} font-medium`}>{stage.stage}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Exchange Reference - Collapsible */}
          <Collapsible open={openSections.exchange} onOpenChange={() => toggleSection('exchange')}>
            <Card className="border-slate-200">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-slate-50 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-slate-700">
                      <MessageSquare className="h-4 w-4" />
                      💬 Review Exchange
                    </CardTitle>
                    {openSections.exchange ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm">
                    <p className="font-medium text-orange-800 mb-1">Customer:</p>
                    <p className="text-orange-700 italic">"{objectionText}"</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="font-medium text-blue-800 mb-1">Your Response:</p>
                    <p className="text-blue-700">"{userResponse}"</p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Growth Celebration Footer */}
          <Card className={`${skillStage.bgGradient} border-0 shadow-lg`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className={`h-5 w-5 ${skillStage.color}`} />
                  <div>
                    <p className="font-bold text-slate-800">
                      👏 You're building real skills — keep practicing to reach {skillStage.stage === 'Foundation' ? 'Growing' : skillStage.stage === 'Growing' ? 'Builder' : skillStage.stage === 'Builder' ? 'Pro' : 'Master'} level!
                    </p>
                    <p className="text-sm text-slate-600">
                      Next milestone: {feedback.sessionProgression.improvementTrend}
                    </p>
                  </div>
                </div>
                <Button 
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg" 
                  onClick={onClose}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Next Challenge!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFeedbackDisplay;