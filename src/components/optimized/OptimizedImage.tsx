import React, { useState, useEffect, useRef } from 'react';
import { useLazyImage } from '@/hooks/useLazyLoading';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  webpSrc?: string;
  alt: string;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  priority?: boolean;
  sizes?: string;
  srcSet?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  webpSrc,
  alt,
  fallback,
  className = '',
  threshold = 0.1,
  rootMargin = '50px',
  priority = false,
  sizes,
  srcSet,
  onLoad,
  onError,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { imageSrc, isImageLoaded, elementRef, shouldLoad } = useLazyImage(
    webpSrc || src, 
    { threshold, rootMargin }
  );
  const imgRef = useRef<HTMLImageElement>(null);

  // Support for WebP detection
  const [supportsWebP, setSupportsWebP] = useState(false);
  
  useEffect(() => {
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    };
    
    setSupportsWebP(checkWebPSupport());
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const getOptimizedSrc = () => {
    if (hasError) return src; // Fallback to original on error
    if (supportsWebP && webpSrc) return webpSrc;
    return src;
  };

  const defaultFallback = (
    <Skeleton className={`w-full h-full min-h-[200px] ${className}`} />
  );

  // For priority images, skip intersection observer
  if (priority) {
    return (
      <picture className="block">
        {webpSrc && (
          <source srcSet={webpSrc} type="image/webp" sizes={sizes} />
        )}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          sizes={sizes}
          srcSet={srcSet}
          loading="eager"
          decoding="sync"
          {...props}
        />
        {!isLoaded && !hasError && (
          <div className="absolute inset-0">
            {fallback || defaultFallback}
          </div>
        )}
      </picture>
    );
  }

  return (
    <div ref={elementRef} className="relative">
      {shouldLoad && isImageLoaded ? (
        <picture className="block">
          {webpSrc && (
            <source srcSet={webpSrc} type="image/webp" sizes={sizes} />
          )}
          <img
            ref={imgRef}
            src={getOptimizedSrc()}
            alt={alt}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
            onLoad={handleLoad}
            onError={handleError}
            sizes={sizes}
            srcSet={srcSet}
            loading="lazy"
            decoding="async"
            {...props}
          />
          {!isLoaded && !hasError && (
            <div className="absolute inset-0">
              {fallback || defaultFallback}
            </div>
          )}
        </picture>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
};

export default OptimizedImage;