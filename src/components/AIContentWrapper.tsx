
import React from 'react';
import AIContentBadge, { AIContentBadgeProps } from './AIContentBadge';
import { cn } from '@/lib/utils';

interface AIContentWrapperProps {
  children: React.ReactNode;
  className?: string;
  badgeProps?: AIContentBadgeProps;
  withBorder?: boolean;
  withBackground?: boolean;
}

/**
 * A wrapper component for AI-generated content
 * Provides visual cues like borders and background to distinguish AI content
 */
const AIContentWrapper = ({
  children,
  className,
  badgeProps,
  withBorder = true,
  withBackground = true,
}: AIContentWrapperProps) => {
  return (
    <div 
      className={cn(
        'relative',
        withBorder && 'border border-purple-200 rounded-lg',
        withBackground && 'bg-purple-50/60',
        className
      )}
    >
      <AIContentBadge {...badgeProps} />
      {children}
    </div>
  );
};

export default AIContentWrapper;
