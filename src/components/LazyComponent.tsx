import React, { Suspense } from 'react';
import { useLazyLoading } from '@/hooks/useLazyLoading';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback,
  className = '',
  threshold = 0.1,
  rootMargin = '100px'
}) => {
  const { isVisible, elementRef } = useLazyLoading({ threshold, rootMargin });

  const defaultFallback = (
    <div className={`space-y-4 ${className}`}>
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  return (
    <div ref={elementRef} className={className}>
      {isVisible ? (
        <Suspense fallback={fallback || defaultFallback}>
          {children}
        </Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
};