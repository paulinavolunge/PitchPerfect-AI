
import React, { ReactNode, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxSectionProps {
  className?: string;
  children: ReactNode;
  overlayColor?: string;
  depth?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  className = '',
  children,
  overlayColor,
  depth = 0.2,
  direction = 'up',
}) => {
  const [elementTop, setElementTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  
  const { scrollY } = useScroll();
  
  // Calculate the distance from the top when the component mounts
  useEffect(() => {
    if (!ref.current) return;
    
    const setValues = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      setElementTop(rect.top + window.scrollY);
      setClientHeight(window.innerHeight);
    };
    
    setValues();
    window.addEventListener('resize', setValues);
    
    return () => {
      window.removeEventListener('resize', setValues);
    };
  }, [ref]);
  
  // Transform based on scroll position
  const getDirectionalTransform = () => {
    switch (direction) {
      case 'up':
        return useTransform(scrollY, [elementTop - clientHeight, elementTop + clientHeight], [depth * 100, -depth * 100]);
      case 'down':
        return useTransform(scrollY, [elementTop - clientHeight, elementTop + clientHeight], [-depth * 100, depth * 100]);
      case 'left':
        return useTransform(scrollY, [elementTop - clientHeight, elementTop + clientHeight], [depth * 100, -depth * 100]);
      case 'right':
        return useTransform(scrollY, [elementTop - clientHeight, elementTop + clientHeight], [-depth * 100, depth * 100]);
      default:
        return useTransform(scrollY, [elementTop - clientHeight, elementTop + clientHeight], [depth * 100, -depth * 100]);
    }
  };
  
  const yTransform = direction === 'up' || direction === 'down' 
    ? getDirectionalTransform() 
    : undefined;
    
  const xTransform = direction === 'left' || direction === 'right' 
    ? getDirectionalTransform() 
    : undefined;
    
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 -z-10"
        style={{
          y: yTransform,
          x: xTransform,
        }}
      >
        <div className="relative w-full h-full">
          <div className="absolute inset-0">
            {/* Abstract shapes */}
            <div className="absolute -left-[10%] top-[10%] w-[30%] h-[30%] rounded-full bg-gradient-to-tr from-teal-200/30 to-cyan-300/20 blur-2xl"></div>
            <div className="absolute -right-[5%] top-[20%] w-[25%] h-[25%] rounded-full bg-gradient-to-tr from-cyan-300/30 to-teal-200/20 blur-2xl"></div>
            <div className="absolute left-[30%] -bottom-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-blue-200/20 to-teal-300/30 blur-3xl"></div>
          </div>
        </div>
      </motion.div>
      
      {overlayColor && (
        <div className="absolute inset-0 -z-10" style={{ backgroundColor: overlayColor }}></div>
      )}
      
      {children}
    </div>
  );
};

export default ParallaxSection;
