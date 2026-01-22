
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((item) => (
          <Skeleton 
            key={item}
            variant="card" 
            className="h-[120px] w-full rounded-lg"
          />
        ))}
      </div>
      
      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts area - 2/3 width */}
        <div className="lg:col-span-2">
          <Skeleton className="h-[350px] w-full rounded-lg" />
          
          <div className="mt-6 space-y-4">
            {[1, 2].map((item) => (
              <Skeleton
                key={`session-${item}`}
                className="h-[72px] w-full rounded-lg"
              />
            ))}
          </div>
        </div>
        
        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          <Skeleton className="h-[180px] w-full rounded-lg" />
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
