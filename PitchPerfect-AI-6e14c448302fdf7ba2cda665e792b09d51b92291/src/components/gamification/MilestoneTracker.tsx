
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  icon?: React.ReactNode;
  rewardDescription?: string;
}

interface MilestoneTrackerProps {
  milestone: Milestone;
  className?: string;
}

export const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({ 
  milestone, 
  className 
}) => {
  const progressPercentage = Math.min(100, Math.round((milestone.currentValue / milestone.targetValue) * 100));
  const isComplete = milestone.currentValue >= milestone.targetValue;
  
  return (
    <div className={cn("p-4 border rounded-lg", isComplete && "bg-brand-green/5 border-brand-green/30", className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-brand-dark">{milestone.title}</h3>
        <div className="flex items-center">
          <span className={cn(
            "text-sm font-medium", 
            isComplete ? "text-brand-green" : "text-brand-dark/70"
          )}>
            {milestone.currentValue}/{milestone.targetValue}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-brand-dark/70 mb-3">{milestone.description}</p>
      
      <div className="space-y-2">
        <Progress value={progressPercentage} className={isComplete ? "bg-brand-green" : ""} />
        
        {isComplete && milestone.rewardDescription && (
          <div className="flex items-center gap-2 mt-3 text-xs text-brand-green">
            <Trophy size={14} />
            <span>Milestone achieved: {milestone.rewardDescription}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface MilestoneListProps {
  milestones: Milestone[];
  className?: string;
}

export const MilestoneList: React.FC<MilestoneListProps> = ({ 
  milestones, 
  className 
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {milestones.map((milestone) => (
        <MilestoneTracker key={milestone.id} milestone={milestone} />
      ))}
    </div>
  );
};

export const getDefaultMilestones = (): Milestone[] => {
  return [
    {
      id: 'practice-sessions',
      title: 'Practice Sessions',
      description: 'Complete 5 practice sessions to build your pitch skills',
      targetValue: 5,
      currentValue: 2,
      rewardDescription: 'Unlock Advanced Pitch Templates'
    },
    {
      id: 'roleplay-scenarios',
      title: 'Roleplay Scenarios',
      description: 'Complete different roleplay scenarios',
      targetValue: 3,
      currentValue: 1,
      rewardDescription: 'Unlock Difficult Customer Personas'
    },
    {
      id: 'perfect-streak',
      title: 'Perfect Streak',
      description: 'Practice for 7 consecutive days',
      targetValue: 7,
      currentValue: 3,
      rewardDescription: 'Unlock Performance Analytics Dashboard'
    }
  ];
};

export default MilestoneTracker;
