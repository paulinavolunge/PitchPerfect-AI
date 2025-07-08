
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import PerformanceOptimizer from '@/utils/performanceOptimizations';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  webpSrc?: string;
  avifSrc?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fallback?: React.ReactNode;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  webpSrc,
  avifSrc,
  sizes = "100vw",
  priority = false,
  className,
  fallback,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [supportsWebP, setSupportsWebP] = useState(false);

  useEffect(() => {
    PerformanceOptimizer.supportsWebP().then(setSupportsWebP);
  }, []);

  const handleError = () => {
    setImageError(true);
  };

  if (imageError && fallback) {
    return <>{fallback}</>;
  }

  // Generate srcSet for responsive images
  const generateSrcSet = (baseSrc: string) => {
    const breakpoints = [320, 640, 768, 1024, 1280, 1536];
    return breakpoints
      .map(width => {
        const extension = baseSrc.split('.').pop();
        const nameWithoutExt = baseSrc.replace(`.${extension}`, '');
        return `${nameWithoutExt}-${width}w.${extension} ${width}w`;
      })
      .join(', ');
  };

  const getOptimalSrc = () => {
    if (supportsWebP && webpSrc) return webpSrc;
    if (avifSrc) return avifSrc;
    return src;
  };

  return (
    <picture>
      {/* AVIF source (best compression) */}
      {avifSrc && (
        <source
          srcSet={generateSrcSet(avifSrc)}
          sizes={sizes}
          type="image/avif"
        />
      )}
      
      {/* WebP source (good compression, wide support) */}
      {(webpSrc || supportsWebP) && (
        <source
          srcSet={generateSrcSet(webpSrc || PerformanceOptimizer.getOptimizedImageSrc(src, 'webp'))}
          sizes={sizes}
          type="image/webp"
        />
      )}
      
      {/* Fallback to original format */}
      <img
        src={getOptimalSrc()}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        className={cn(
          'transition-opacity duration-300',
          imageError ? 'opacity-0' : 'opacity-100',
          className
        )}
        onError={handleError}
        {...props}
      />
    </picture>
  );
};
