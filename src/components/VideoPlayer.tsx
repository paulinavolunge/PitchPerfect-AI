
import React, { useRef, useEffect, useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface VideoPlayerProps {
  posterSrc: string;
  videoSrc: string;
  fallbackSrc: string;
  className?: string;
  onStartClick?: () => void;
  showStartButton?: boolean;
}

const VideoPlayer = ({ 
  posterSrc, 
  videoSrc, 
  fallbackSrc, 
  className = '',
  onStartClick,
  showStartButton = false
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log('Auto-play was prevented:', error);
      });
    }
  }, []);

  const handleStartDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onStartClick) {
      onStartClick();
    }
    setIsPlaying(true);
  };

  return (
    <AspectRatio ratio={16 / 9} className={`overflow-hidden rounded-lg relative ${className}`}>
      {showStartButton && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-30">
          <Button 
            onClick={handleStartDemo} 
            className="bg-brand-blue hover:bg-brand-blue/90 text-white flex items-center gap-2"
            size="lg"
          >
            <Play size={18} /> Start Demo
          </Button>
        </div>
      )}
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
