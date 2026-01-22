import React from 'react';
import { cn } from '@/lib/utils';

interface FocusRingProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

export const FocusRing: React.FC<FocusRingProps> = ({ 
  children, 
  className,
  visible = true 
}) => {
  return (
    <div
      className={cn(
        visible && "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 rounded-md",
        className
      )}
    >
      {children}
    </div>
  );
};