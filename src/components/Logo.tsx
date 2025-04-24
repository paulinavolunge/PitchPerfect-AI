
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo = ({ size = 'md', className }: LogoProps) => {
  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl md:text-4xl', // Increased text size for desktop
    lg: 'text-3xl md:text-5xl'  // Even larger text for lg size
  };

  const imageSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14 md:w-28 md:h-28', // Significantly larger on desktop
    lg: 'w-16 h-16 md:w-32 md:h-32'  // Even larger option for lg size
  };

  return (
    <div className={cn(
      "flex items-center gap-4 font-semibold dark:text-white",
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
        Pitch<span className="text-brand-blue dark:text-brand-green">Perfect</span> AI
      </span>
    </div>
  );
};

export default Logo;
