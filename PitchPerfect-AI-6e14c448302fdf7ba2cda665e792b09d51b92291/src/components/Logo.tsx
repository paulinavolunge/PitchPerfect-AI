
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo = ({ size = 'md', className }: LogoProps) => {
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl md:text-2xl',
    lg: 'text-2xl md:text-3xl'
  };

  const imageSizeClasses = {
    sm: 'h-7 w-auto',
    md: 'h-8 md:h-10 w-auto',
    lg: 'h-10 md:h-12 w-auto'
  };

  return (
    <div className={cn(
      "flex items-center gap-3 font-semibold text-foreground",
      textSizeClasses[size],
      className
    )}>
      <img 
        src="/assets/logo-pitchperfectai-optimized.webp"
        alt="PitchPerfect AI Logo" 
        className={cn(
          "object-contain bg-transparent transition-all duration-300 flex-shrink-0", 
          imageSizeClasses[size]
        )}
        loading="eager"
        decoding="async"
      />
      <span className="font-bold whitespace-nowrap">
        Pitch<span className="text-primary">Perfect</span> AI
      </span>
    </div>
  );
};

export default Logo;
