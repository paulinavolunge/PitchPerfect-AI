
import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = "100vw"
}) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn("object-cover", className)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      sizes={sizes}
    />
  );
};
