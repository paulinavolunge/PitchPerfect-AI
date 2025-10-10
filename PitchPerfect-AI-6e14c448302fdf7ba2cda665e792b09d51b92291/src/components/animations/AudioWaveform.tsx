
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface AudioWaveformProps {
  isActive?: boolean;
  color?: string;
  barCount?: number;
  className?: string;
  isUser?: boolean;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive = true,
  color = '#008D95',
  barCount = 30,
  className = '',
  isUser = false,
}) => {
  const [bars, setBars] = useState<number[]>([]);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  
  // Generate initial bar heights
  useEffect(() => {
    const initialBars = Array.from({ length: barCount }, () => Math.random() * 0.5 + 0.2);
    setBars(initialBars);
  }, [barCount]);
  
  // Animation loop
  useEffect(() => {
    if (!isActive) return;
    
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        // Only update every 100ms for performance
        if (time - previousTimeRef.current > 100) {
          setBars(prevBars => prevBars.map((height) => {
            // Different animation pattern based on user or AI
            if (isUser) {
              // More aggressive, reactive pattern for user speech
              return Math.min(0.9, Math.max(0.1, height + (Math.random() * 0.4 - 0.2)));
            } else {
              // Smoother, more rhythmic pattern for AI responses
              return Math.min(0.9, Math.max(0.1, height + (Math.random() * 0.3 - 0.15)));
            }
          }));
          previousTimeRef.current = time;
        }
      } else {
        previousTimeRef.current = time;
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isActive, isUser]);
  
  // Inactive state - bars should be at minimum height
  useEffect(() => {
    if (!isActive) {
      setBars(Array.from({ length: barCount }, () => 0.1));
    }
  }, [isActive, barCount]);
  
  return (
    <div className={`flex items-center justify-center h-12 space-x-0.5 ${className}`}>
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className="rounded-full w-1"
          style={{ 
            backgroundColor: color,
            height: isActive ? `${height * 100}%` : '10%',
          }}
          initial={false}
          animate={{ height: `${height * 100}%` }}
          transition={{ duration: 0.2 }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;
