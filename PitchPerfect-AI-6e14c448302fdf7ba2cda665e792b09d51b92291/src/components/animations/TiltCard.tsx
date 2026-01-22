
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltFactor?: number; // 0-10 scale, higher means more tilt
  glareOpacity?: number; // 0-1 scale
}

const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  tiltFactor = 5,
  glareOpacity = 0.1,
}) => {
  const [tiltPosition, setTiltPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  
  // Scale tilt factor (0-10) to actual rotation degrees (0-20)
  const maxTilt = (tiltFactor / 10) * 20;
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    
    setTiltPosition({ x: -y * maxTilt, y: x * maxTilt });
  };
  
  const handleMouseLeave = () => {
    setTiltPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };
  
  return (
    <motion.div
      className={`relative overflow-hidden transform-gpu ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tiltPosition.x,
        rotateY: tiltPosition.y,
        scale: isHovered ? 1.02 : 1,
        z: isHovered ? 10 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {/* Glare effect */}
      {glareOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(
              circle at ${50 + tiltPosition.y / maxTilt * 50}% ${50 - tiltPosition.x / maxTilt * 50}%,
              rgba(255, 255, 255, ${glareOpacity}),
              transparent 80%
            )`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 300ms ease-in-out',
            mixBlendMode: 'overlay',
          }}
        />
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default TiltCard;
