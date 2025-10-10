import React from 'react';
import { 
  Trophy, 
  Award, 
  Star, 
  Mic, 
  MessageSquare,
  Check
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  level?: number;
  progress?: number;
  maxProgress?: number;
  colorClass: string;  // The property is colorClass, not color
}

interface BadgeProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
}

interface BadgeRowProps {
  badges: Badge[];
  title?: string;
}

export const BadgeIcon: React.FC<BadgeProps> = ({ badge, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-12 h-12 p-2',
    lg: 'w-16 h-16 p-3',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative flex items-center justify-center rounded-full ${sizeClasses[size]} ${badge.unlocked ? badge.colorClass : 'bg-gray-200'}`}>
            <div className={`${iconSizes[size]} text-white`}>
              {badge.icon}
            </div>
            {badge.level && badge.level > 1 && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-gray-200 text-gray-700">
                {badge.level}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm font-medium">{badge.name}</div>
          <div className="text-xs text-muted-foreground">{badge.description}</div>
          {!badge.unlocked && badge.progress !== undefined && (
            <div className="text-xs mt-1">
              Progress: {badge.progress}/{badge.maxProgress}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const BadgeRow: React.FC<BadgeRowProps> = ({ badges, title }) => {
  return (
    <div className="mb-6">
      {title && <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>}
      <div className="flex flex-wrap gap-3">
        {badges.map(badge => (
          <BadgeIcon key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
};

export const getDefaultBadges = (): Badge[] => {
  return [
    {
      id: 'first-pitch',
      name: 'First Pitch',
      description: 'Completed your first practice pitch',
      icon: <Mic />,
      unlocked: false,
      colorClass: 'bg-brand-green',
    },
    {
      id: 'roleplay-master',
      name: 'Roleplay Master',
      description: 'Completed 5 roleplay scenarios',
      icon: <MessageSquare />,
      unlocked: false,
      progress: 0,
      maxProgress: 5,
      colorClass: 'bg-brand-blue',
    },
    {
      id: 'perfect-streak',
      name: 'Perfect Streak',
      description: 'Practice for 3 days in a row',
      icon: <Trophy />,
      unlocked: false,
      progress: 0,
      maxProgress: 3,
      colorClass: 'bg-amber-500',
    },
    {
      id: 'feedback-ace',
      name: 'Feedback Ace',
      description: 'Improve your score by 20% in any category',
      icon: <Award />,
      unlocked: false,
      colorClass: 'bg-purple-500',
    },
    {
      id: 'pitch-expert',
      name: 'Pitch Expert',
      description: 'Complete 10 practice sessions',
      icon: <Star />,
      level: 1,
      unlocked: false,
      progress: 0,
      maxProgress: 10,
      colorClass: 'bg-indigo-500',
    },
    {
      id: 'objection-handler',
      name: 'Objection Handler',
      description: 'Successfully handle 3 difficult objections',
      icon: <Check />,
      unlocked: false,
      progress: 0,
      maxProgress: 3,
      colorClass: 'bg-emerald-500',
    }
  ];
};

export default BadgeIcon;
