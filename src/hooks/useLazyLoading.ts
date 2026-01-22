import { useEffect, useRef, useState } from 'react';

interface UseLazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
}

export const useLazyLoading = ({ 
  threshold = 0.1, 
  rootMargin = '50px' 
}: UseLazyLoadingOptions = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoaded) {
          setIsVisible(true);
          setIsLoaded(true);
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, isLoaded]);

  return { isVisible, isLoaded, elementRef };
};

export const useLazyImage = (src: string, options?: UseLazyLoadingOptions) => {
  const { isVisible, elementRef } = useLazyLoading(options);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    if (isVisible && src) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsImageLoaded(true);
      };
      img.src = src;
    }
  }, [isVisible, src]);

  return { 
    imageSrc, 
    isImageLoaded, 
    elementRef,
    shouldLoad: isVisible 
  };
};