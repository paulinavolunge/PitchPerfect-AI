
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HelpIconProps {
  tooltip: string;
  className?: string;
  size?: number;
}

const HelpIcon = ({ tooltip, className, size = 16 }: HelpIconProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          type="button" 
          className={cn(
            "text-gray-400 transition-colors hover:text-[#008D95] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#008D95] rounded-full", 
            className
          )}
          aria-label={`Help: ${tooltip}`}
        >
          <HelpCircle size={size} />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-sm">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default HelpIcon;
