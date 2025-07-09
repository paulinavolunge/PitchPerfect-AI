import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  webpSrc?: string;
  avifSrc?: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  webpSrc,
  avifSrc,
  alt,
  priority = false,
  sizes = "100vw",
  className,
  ...props
}) => {
  const imageClass = cn("", className);
  
  // If we have modern formats, use picture element
  if (webpSrc || avifSrc) {
    return (
      <picture>
        {avifSrc && <source srcSet={avifSrc} type="image/avif" />}
        {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
        <img
          src={src}
          alt={alt}
          className={imageClass}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          sizes={sizes}
          {...props}
        />
      </picture>
    );
  }
  
  // Fallback to regular img
  return (
    <img
      src={src}
      alt={alt}
      className={imageClass}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      sizes={sizes}
      {...props}
    />
  );
};