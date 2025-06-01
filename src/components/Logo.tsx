
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
    sm: 'w-8 h-8',
    md: 'w-10 h-10 md:w-12 md:h-12',
    lg: 'w-12 h-12 md:w-14 md:h-14'
  };

  return (
    <div className={cn(
      "flex items-center gap-3 font-semibold dark:text-white",
      textSizeClasses[size],
      className
    )}>
      <img 
        src="/lovable-uploads/5b9309ea-3b10-4401-9c33-7d84a6e1fa68.png" 
        alt="PitchPerfect AI Logo" 
        className={cn(
          "object-contain bg-transparent transition-all duration-300 flex-shrink-0", 
          imageSizeClasses[size]
        )} 
      />
      <span className="font-bold whitespace-nowrap">
        Pitch<span className="text-blue-600 dark:text-green-500">Perfect</span> AI
      </span>
    </div>
  );
};

export default Logo;
