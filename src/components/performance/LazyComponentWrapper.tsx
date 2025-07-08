
import React, { Suspense, lazy } from 'react';
import { useLazyLoading } from '@/hooks/use-lazy-loading';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface LazyComponentWrapperProps {
  componentImporter: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  threshold?: number;
  children?: React.ReactNode;
  className?: string;
}

export const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({
  componentImporter,
  fallback = <LoadingSpinner />,
  threshold = 0.5,
  children,
  className
}) => {
  const shouldLoad = useLazyLoading({ threshold });
  
  if (!shouldLoad) {
    return (
      <div className={className}>
        {children || (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        )}
      </div>
    );
  }

  const LazyComponent = lazy(componentImporter);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent />
    </Suspense>
  );
};

// Specific lazy wrappers for heavy components
export const LazyAnalytics = () => (
  <LazyComponentWrapper
    componentImporter={() => import('@/pages/Analytics')}
    threshold={0.3}
  />
);

export const LazyDashboard = () => (
  <LazyComponentWrapper
    componentImporter={() => import('@/pages/Dashboard')}
    threshold={0.1}
  />
);

export const LazyCharts = () => (
  <LazyComponentWrapper
    componentImporter={() => import('recharts').then(module => ({ default: module.ResponsiveContainer }))}
    threshold={0.4}
  />
);
