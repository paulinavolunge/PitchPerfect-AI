
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo = ({ size = 'md', className }: LogoProps) => {
  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const imageSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14 lg:w-16 lg:h-16',
    lg: 'w-16 h-16 lg:w-20 lg:h-20'
  };

  return (
    <div className={cn(
      "flex items-center gap-4 font-semibold",
      textSizeClasses[size],
      className
    )}>
      <img 
        src="/lovable-uploads/5b9309ea-3b10-4401-9c33-7d84a6e1fa68.png" 
        alt="PitchPerfect AI Logo" 
        className={cn(
          "object-contain bg-transparent transition-all duration-300", 
          imageSizeClasses[size]
        )} 
      />
      <span className="font-bold whitespace-nowrap">
        Pitch<span className="text-brand-blue">Perfect</span> AI
      </span>
    </div>
  );
};

export default Logo;
