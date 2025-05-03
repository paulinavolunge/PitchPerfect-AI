
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeIcon, Badge } from './BadgeSystem';
import { Trophy, Award, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AIContentWrapper from '@/components/AIContentWrapper';
import { cn } from '@/lib/utils';

interface ProgressStat {
  label: string;
  value: number;
  previousValue?: number;
  increase?: boolean;
  decrease?: boolean;
}

interface FeedbackPoint {
  text: string;
  type: 'strength' | 'improvement';
}

interface ProgressSummaryProps {
  sessionName: string;
  stats: ProgressStat[];
  feedback: FeedbackPoint[];
  earnedBadges?: Badge[];
  nextMilestone?: {
    name: string;
    progress: number;
    total: number;
  };
  onClose: () => void;
  className?: string;
}

const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  sessionName,
  stats,
  feedback,
  earnedBadges = [],
  nextMilestone,
  onClose,
  className
}) => {
  const navigate = useNavigate();
  
  const handleViewProgress = () => {
    navigate('/progress');
    onClose();
  };

  return (
    <Card className={cn("border-brand-green/30", className)}>
      <CardHeader className="bg-brand-green/5 pb-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-brand-dark">Session Complete!</CardTitle>
          <div className="flex gap-1">
            <Trophy size={18} className="text-amber-500" />
            <Star size={18} className="text-amber-500" />
            <Award size={18} className="text-amber-500" />
          </div>
        </div>
        <p className="text-sm text-brand-dark/70">{sessionName}</p>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Your Performance</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map((stat, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-brand-dark/70 mb-1">{stat.label}</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-xl font-semibold text-brand-dark">{stat.value}%</div>
                  {stat.previousValue !== undefined && (stat.increase || stat.decrease) && (
                    <div className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      stat.increase ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    )}>
                      {stat.increase ? '+' : ''}{stat.value - stat.previousValue}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <AIContentWrapper badgeProps={{ variant: "subtle" }} className="mb-6 p-4">
          <h3 className="text-sm font-medium mb-3">AI Feedback</h3>
          <div className="space-y-3">
            {feedback.filter(item => item.type === 'strength').length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-brand-dark/70 mb-1">Strengths</h4>
                <ul className="text-sm space-y-1">
                  {feedback.filter(item => item.type === 'strength').map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="min-w-4 text-brand-green">•</div>
                      <div>{item.text}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {feedback.filter(item => item.type === 'improvement').length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-brand-dark/70 mb-1">Areas for Improvement</h4>
                <ul className="text-sm space-y-1">
                  {feedback.filter(item => item.type === 'improvement').map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="min-w-4 text-amber-600">•</div>
                      <div>{item.text}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AIContentWrapper>
        
        {earnedBadges.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Badges Earned</h3>
            <div className="flex flex-wrap gap-3">
              {earnedBadges.map((badge) => (
                <BadgeIcon key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        )}
        
        {nextMilestone && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Next Milestone</h3>
            <div className="bg-brand-blue/10 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium">{nextMilestone.name}</p>
                <span className="text-xs text-brand-dark/70">{nextMilestone.progress}/{nextMilestone.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div 
                  className="bg-brand-blue rounded-full h-2" 
                  style={{ width: `${Math.min(100, (nextMilestone.progress / nextMilestone.total) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            className="bg-brand-green hover:bg-brand-green/90 flex items-center gap-2"
            onClick={handleViewProgress}
          >
            View Progress Details
            <ArrowRight size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressSummary;
