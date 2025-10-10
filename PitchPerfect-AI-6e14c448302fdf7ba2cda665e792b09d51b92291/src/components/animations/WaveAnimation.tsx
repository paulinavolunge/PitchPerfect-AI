
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface WaveAnimationProps {
  className?: string;
  color?: string;
  speed?: number;
  opacity?: number;
  amplitude?: number;
}

const WaveAnimation: React.FC<WaveAnimationProps> = ({
  className = '',
  color = '#008D95',
  speed = 1,
  opacity = 0.3,
  amplitude = 20,
}) => {
  const waveRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!waveRef.current) return;
      
      // Get the position relative to the SVG
      const rect = waveRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Adjust the wave based on mouse position
      const paths = waveRef.current.querySelectorAll('path');
      paths.forEach((path, i) => {
        const pathAmplitude = amplitude - (i * 5);
        const d = `M 0 ${50 + (Math.sin(x/10) * pathAmplitude)} C 40 ${40 + (Math.cos(x/15) * pathAmplitude)}, 60 ${60 + (Math.sin(y/10) * pathAmplitude)}, 100 ${50 + (Math.cos(y/15) * pathAmplitude)}`;
        path.setAttribute('d', d);
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [amplitude]);
  
  return (
    <svg 
      ref={waveRef}
      className={`absolute w-full h-full ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <motion.path
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ 
          opacity, 
          pathLength: 1,
          d: `M 0 ${50 + amplitude} C 40 ${40 + amplitude}, 60 ${60 + amplitude}, 100 ${50 + amplitude}`
        }}
        transition={{ 
          repeat: Infinity,
          repeatType: "reverse", 
          duration: 3 * speed,
          ease: "easeInOut",
        }}
        fill="none"
        stroke={color}
        strokeWidth="0.5"
      />
      <motion.path
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ 
          opacity: opacity * 0.7, 
          pathLength: 1,
          d: `M 0 ${50 + amplitude/1.5} C 40 ${60 + amplitude/1.5}, 60 ${40 + amplitude/1.5}, 100 ${50 + amplitude/1.5}`
        }}
        transition={{ 
          repeat: Infinity,
          repeatType: "reverse", 
          duration: 2.5 * speed,
          ease: "easeInOut",
          delay: 0.2,
        }}
        fill="none"
        stroke={color}
        strokeWidth="0.5"
      />
      <motion.path
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ 
          opacity: opacity * 0.5, 
          pathLength: 1,
          d: `M 0 ${50 + amplitude/2} C 40 ${40 + amplitude/2}, 60 ${60 + amplitude/2}, 100 ${50 + amplitude/2}`
        }}
        transition={{ 
          repeat: Infinity,
          repeatType: "reverse", 
          duration: 2 * speed,
          ease: "easeInOut",
          delay: 0.4,
        }}
        fill="none"
        stroke={color}
        strokeWidth="0.5"
      />
    </svg>
  );
};

export default WaveAnimation;
