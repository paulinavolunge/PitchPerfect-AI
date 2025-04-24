
import React from 'react';
import { Mic } from 'lucide-react';
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

  const iconSizeMap = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <div className={cn("flex items-center gap-2 font-semibold", textSizeClasses[size], className)}>
      <div className="bg-brand-green text-white p-1 rounded-md">
        <Mic size={iconSizeMap[size]} strokeWidth={2.5} />
      </div>
      <span>Pitch<span className="text-brand-green">Perfect</span> AI</span>
    </div>
  );
};

export default Logo;
