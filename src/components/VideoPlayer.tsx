
import React, { useRef, useEffect } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface VideoPlayerProps {
  posterSrc: string;
  videoSrc: string;
  fallbackSrc: string;
  className?: string;
}

const VideoPlayer = ({ posterSrc, videoSrc, fallbackSrc, className = '' }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log('Auto-play was prevented:', error);
      });
    }
  }, []);

  return (
    <AspectRatio ratio={16 / 9} className={`overflow-hidden rounded-lg ${className}`}>
      <picture>
        <source srcSet={fallbackSrc} type="image/png" media="(max-width: 768px)" />
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={posterSrc}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </picture>
    </AspectRatio>
  );
};

export default VideoPlayer;
