import React from 'react';
import { useLazyImage } from '@/hooks/useLazyLoading';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallback,
  className = '',
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const { imageSrc, isImageLoaded, elementRef } = useLazyImage(src, { 
    threshold, 
    rootMargin 
  });

  const defaultFallback = (
    <Skeleton className={`w-full h-full ${className}`} />
  );

  return (
    <div ref={elementRef} className="relative">
      {isImageLoaded ? (
        <img
          src={imageSrc}
          alt={alt}
          className={className}
          loading="lazy"
          {...props}
        />
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
};