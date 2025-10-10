
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const AppSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-50">
      {/* Navbar skeleton */}
      <div className="bg-white border-b border-navy-100 px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="hidden md:flex space-x-6">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Hero section skeleton */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <Skeleton className="h-4 w-48 mx-auto mb-4" />
          <Skeleton className="h-12 w-96 mx-auto mb-6" />
          <Skeleton className="h-6 w-80 mx-auto mb-8" />
          <div className="flex justify-center space-x-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>

        {/* Features skeleton */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-16 w-16 rounded-xl mx-auto mb-4" />
              <Skeleton className="h-6 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppSkeleton;
