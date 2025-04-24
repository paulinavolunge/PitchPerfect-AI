
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo = ({ size = 'md', className }: LogoProps) => {
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={cn("flex items-center gap-3 font-semibold", textSizeClasses[size], className)}>
      <img 
        src="/lovable-uploads/255b0025-56b1-4a4a-b966-bb658c0c5a51.png" 
        alt="PitchPerfect AI Logo" 
        className={cn(
          "object-contain", 
          size === 'sm' ? 'w-8 h-8' : 
          size === 'md' ? 'w-10 h-10' : 
          'w-12 h-12'
        )} 
      />
      <span>Pitch<span className="text-brand-blue">Perfect</span> AI</span>
    </div>
  );
};

export default Logo;
