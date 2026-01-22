import React, { Suspense, useState, useEffect } from 'react';
import { useLazyLoading } from '@/hooks/useLazyLoading';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoadManagerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  priority?: 'high' | 'normal' | 'low';
  enableIntersectionObserver?: boolean;
  preloadDelay?: number;
}

const LazyLoadManager: React.FC<LazyLoadManagerProps> = ({
  children,
  fallback,
  className = '',
  threshold = 0.1,
  rootMargin = '200px', // Increased margin for better UX
  priority = 'normal',
  enableIntersectionObserver = true,
  preloadDelay = 0
}) => {
  const [shouldPreload, setShouldPreload] = useState(priority === 'high');
  const { isVisible, elementRef } = useLazyLoading({ 
    threshold, 
    rootMargin: priority === 'high' ? '300px' : rootMargin 
  });

  useEffect(() => {
    if (priority === 'high' && preloadDelay > 0) {
      const timer = setTimeout(() => {
        setShouldPreload(true);
      }, preloadDelay);
      return () => clearTimeout(timer);
    }
  }, [priority, preloadDelay]);

  const shouldLoad = !enableIntersectionObserver || isVisible || shouldPreload;

  const enhancedFallback = fallback || (
    <div className={`space-y-4 animate-pulse ${className}`}>
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  return (
    <div ref={elementRef} className={className}>
      {shouldLoad ? (
        <Suspense fallback={enhancedFallback}>
          {children}
        </Suspense>
      ) : (
        enhancedFallback
      )}
    </div>
  );
};

export default LazyLoadManager;