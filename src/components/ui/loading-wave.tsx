
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingWaveProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  color?: string;
  logoColor?: string;
}

const LoadingWave: React.FC<LoadingWaveProps> = ({
  message = 'Loading...',
  size = 'medium',
  className = '',
  color = '#008D95',
  logoColor = '#4A90E6'
}) => {
  const sizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };
  
  const waveSize = {
    small: 16,
    medium: 30,
    large: 40
  };
  
  // Generate bars with different delays
  const bars = Array.from({ length: 5 }, (_, i) => ({
    delay: i * 0.1,
    height: Math.random() * 0.5 + 0.5
  }));
  
  return (
    <div 
      className={cn(`flex flex-col items-center justify-center py-4 ${className}`)}
      role="status" 
      aria-live="polite"
    >
      <div className="relative" style={{ height: waveSize[size], width: waveSize[size] * 3 }}>
        {/* Logo branding */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <svg width={waveSize[size] * 0.8} height={waveSize[size] * 0.8} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6v12m-6-6h12" stroke={logoColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        {/* Animated wave bars */}
        <div className="flex items-center justify-center space-x-1 h-full">
          {bars.map((bar, index) => (
            <motion.div
              key={index}
              className="rounded-full"
              style={{ 
                backgroundColor: color,
                width: waveSize[size] / 8,
              }}
              animate={{
                height: ['20%', '80%', '20%']
              }}
              transition={{
                duration: 1.2,
                ease: "easeInOut",
                repeat: Infinity,
                delay: bar.delay,
              }}
            />
          ))}
        </div>
      </div>
      
      {message && <p className={`mt-3 ${sizeClass[size]} text-brand-dark/70 animate-pulse`}>{message}</p>}
    </div>
  );
};

export default LoadingWave;
