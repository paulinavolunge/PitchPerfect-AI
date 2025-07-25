import React from 'react';
import { LazyComponent } from '@/components/LazyComponent';

interface LazySectionProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazySection: React.FC<LazySectionProps> = ({
  children,
  className,
  threshold = 0.1,
  rootMargin = '100px'
}) => {
  return (
    <LazyComponent
      className={className}
      threshold={threshold}
      rootMargin={rootMargin}
    >
      {children}
    </LazyComponent>
  );
};