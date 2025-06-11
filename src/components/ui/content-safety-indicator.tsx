
import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { SafetyLevel } from '@/utils/contentSafety';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ContentSafetyIndicatorProps {
  level: SafetyLevel;
  issues?: string[];
  className?: string;
}

export const ContentSafetyIndicator: React.FC<ContentSafetyIndicatorProps> = ({
  level,
  issues = [],
  className = ''
}) => {
  const getIndicatorConfig = () => {
    switch (level) {
      case SafetyLevel.SAFE:
        return {
          icon: ShieldCheck,
          variant: 'default' as const,
          color: 'text-green-600',
          label: 'Safe',
          description: 'Content passes all safety checks'
        };
      case SafetyLevel.SUSPICIOUS:
        return {
          icon: ShieldAlert,
          variant: 'secondary' as const,
          color: 'text-yellow-600',
          label: 'Filtered',
          description: 'Content has been automatically filtered'
        };
      case SafetyLevel.HARMFUL:
        return {
          icon: ShieldX,
          variant: 'destructive' as const,
          color: 'text-red-600',
          label: 'Harmful',
          description: 'Content contains potentially harmful material'
        };
      case SafetyLevel.BLOCKED:
        return {
          icon: Shield,
          variant: 'destructive' as const,
          color: 'text-red-700',
          label: 'Blocked',
          description: 'Content violates safety policies'
        };
      default:
        return {
          icon: Shield,
          variant: 'outline' as const,
          color: 'text-gray-600',
          label: 'Unknown',
          description: 'Content safety status unknown'
        };
    }
  };

  const config = getIndicatorConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className={`flex items-center gap-1 touch-manipulation ${className}`}>
            <Icon size={10} className={`${config.color} sm:size-3`} />
            <span className="text-xs">{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-medium">{config.description}</p>
            {issues.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Issues detected:</p>
                <ul className="text-xs mt-1 space-y-1">
                  {issues.slice(0, 3).map((issue, index) => (
                    <li key={index} className="break-words">• {issue}</li>
                  ))}
                  {issues.length > 3 && (
                    <li>• ... and {issues.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
