
import React, { useEffect, useState } from 'react';
import { createSafeStyleProps, validateConfettiKeyframes } from '@/utils/htmlSanitizer';

interface ConfettiEffectProps {
  active: boolean;
  duration?: number;
  onComplete?: () => void;
  density?: number; // 1-10 scale for particle density
}

const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ 
  active, 
  duration = 3000,
  onComplete,
  density = 5
}) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    rotation: number;
    speedX: number;
    speedY: number;
    speedRotation: number;
  }>>([]);
  
  const [isActive, setIsActive] = useState(false);
  
  // Calculate number of particles based on density
  const particleCount = density * 10;
  
  // Colors for the confetti pieces
  const colors = ['#008D95', '#33C3F0', '#F97316', '#9b87f5', '#4A90E6'];
  
  useEffect(() => {
    if (active && !isActive) {
      setIsActive(true);
      
      // Generate confetti particles
      const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
        id: i,
        x: Math.random() * 100, // position as percentage of screen width
        y: -5 - Math.random() * 10, // start above the viewport
        size: Math.random() * 1 + 0.5, // random size between 0.5 and 1.5rem
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        speedX: Math.random() * 2 - 1, // horizontal speed
        speedY: Math.random() * 3 + 2, // vertical falling speed
        speedRotation: Math.random() * 6 - 3 // rotation speed
      }));
      
      setParticles(newParticles);
      
      // Clear confetti after duration
      const timer = setTimeout(() => {
        setParticles([]);
        setIsActive(false);
        onComplete?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [active, isActive, duration, onComplete, colors, particleCount]);
  
  if (!isActive) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(particle => {
        // Define the keyframes for this particle's animations
        const keyframeStyles = `
          @keyframes confetti-fall-x-${particle.id} {
            to { transform: translateX(${particle.speedX * 100}px) scale(${particle.size}) rotate(${particle.rotation + particle.speedRotation * 360}deg); }
          }
          
          @keyframes confetti-fall-y-${particle.id} {
            to { transform: translateY(${window.innerHeight}px); }
          }
          
          @keyframes confetti-rotate-${particle.id} {
            to { transform: rotate(${particle.speedRotation > 0 ? 360 : -360}deg); }
          }
        `;
        
        return (
          <div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              color: particle.color,
              transform: `scale(${particle.size}) rotate(${particle.rotation}deg)`,
              animation: `
                confetti-fall-x-${particle.id} ${duration}ms linear forwards,
                confetti-fall-y-${particle.id} ${duration}ms ease-in forwards,
                confetti-rotate-${particle.id} ${duration}ms linear infinite
              `
            }}
          >
            {/* Custom confetti shape instead of using a Lucide icon */}
            <div className="w-5 h-5 rounded-sm" style={{ backgroundColor: particle.color }}></div>
            
            {/* Add the keyframe styles in a regular style tag - validated for security */}
            <style dangerouslySetInnerHTML={createSafeStyleProps(keyframeStyles, (css) => validateConfettiKeyframes(css, particle.id))} />
          </div>
        );
      })}
    </div>
  );
};

export default ConfettiEffect;
