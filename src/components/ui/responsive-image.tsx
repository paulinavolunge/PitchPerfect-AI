import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  webpSrc?: string;
  avifSrc?: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  srcSet?: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  webpSrc,
  avifSrc,
  alt,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  className,
  srcSet,
  ...props
}) => {
  const imageClass = cn("", className);
  
  // Generate responsive srcSet if not provided
  const generateSrcSet = (baseSrc: string) => {
    if (srcSet) return srcSet;
    
    // Generate multiple sizes for responsive images
    const baseName = baseSrc.split('.')[0];
    const extension = baseSrc.split('.').pop();
    
    return [
      `${baseName}-320w.${extension} 320w`,
      `${baseName}-640w.${extension} 640w`,
      `${baseName}-768w.${extension} 768w`,
      `${baseName}-1024w.${extension} 1024w`,
      `${baseName}-1200w.${extension} 1200w`,
    ].join(', ');
  };
  
  // If we have modern formats, use picture element with responsive srcsets
  if (webpSrc || avifSrc) {
    return (
      <picture>
        {avifSrc && (
          <source 
            srcSet={generateSrcSet(avifSrc)} 
            sizes={sizes}
            type="image/avif" 
          />
        )}
        {webpSrc && (
          <source 
            srcSet={generateSrcSet(webpSrc)} 
            sizes={sizes}
            type="image/webp" 
          />
        )}
        <img
          src={src}
          srcSet={generateSrcSet(src)}
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
  
  // Fallback to regular img with responsive srcSet
  return (
    <img
      src={src}
      srcSet={generateSrcSet(src)}
      alt={alt}
      className={imageClass}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      sizes={sizes}
      {...props}
    />
  );
};