
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
        src="/lovable-uploads/1167785f-2451-4e85-a1ae-a2bf86c90a95.png" 
        alt="PitchPerfect AI Logo" 
        className={cn(
          "object-contain bg-transparent", 
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
