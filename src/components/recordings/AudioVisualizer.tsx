
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  audioLevel: number; // Normalized 0-1
  isRecording: boolean;
  width?: number;
  height?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  idleColor?: string;
  className?: string;
  visualizationType?: 'bar' | 'waveform';
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = React.memo(
  ({
    audioLevel,
    isRecording,
    width = 200,
    height = 60,
    foregroundColor = '#3b82f6', // blue-500
    backgroundColor = '#f3f4f6', // gray-100
    idleColor = '#d1d5db', // gray-300
    className,
    visualizationType = 'bar',
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        // Clear canvas with background color
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        if (isRecording) {
          // Clamp audioLevel between 0 and 1 for visualization
          const normalizedLevel = Math.max(0, Math.min(1, audioLevel));
          
          if (visualizationType === 'bar') {
            drawBarVisualization(ctx, normalizedLevel, width, height, foregroundColor);
          } else {
            drawWaveformVisualization(ctx, normalizedLevel, width, height, foregroundColor);
          }
        } else {
          drawIdleState(ctx, width, height, idleColor);
        }
      };

      draw();
    }, [audioLevel, isRecording, width, height, foregroundColor, backgroundColor, idleColor, visualizationType]);

    const drawBarVisualization = (
      ctx: CanvasRenderingContext2D,
      level: number,
      canvasWidth: number,
      canvasHeight: number,
      color: string
    ) => {
      const barWidth = canvasWidth * 0.8;
      const barHeight = Math.max(2, level * canvasHeight * 0.9);
      const x = (canvasWidth - barWidth) / 2;
      const y = canvasHeight - barHeight - 5;

      // Create gradient for visual appeal
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '80'); // Add transparency

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Add a subtle border
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);
    };

    const drawWaveformVisualization = (
      ctx: CanvasRenderingContext2D,
      level: number,
      canvasWidth: number,
      canvasHeight: number,
      color: string
    ) => {
      const centerY = canvasHeight / 2;
      const numBars = 20;
      const barWidth = (canvasWidth * 0.8) / numBars;
      const startX = (canvasWidth - (numBars * barWidth)) / 2;

      ctx.fillStyle = color;

      for (let i = 0; i < numBars; i++) {
        // Create random-looking bars that respond to audio level
        const randomMultiplier = Math.sin(Date.now() * 0.01 + i) * 0.5 + 0.5;
        const barHeight = Math.max(2, level * randomMultiplier * (canvasHeight * 0.4));
        
        const x = startX + i * barWidth;
        const y = centerY - barHeight / 2;

        ctx.fillRect(x, y, barWidth * 0.7, barHeight);
      }
    };

    const drawIdleState = (
      ctx: CanvasRenderingContext2D,
      canvasWidth: number,
      canvasHeight: number,
      color: string
    ) => {
      const centerY = canvasHeight / 2;
      
      // Draw a simple horizontal line to indicate idle state
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(canvasWidth * 0.1, centerY);
      ctx.lineTo(canvasWidth * 0.9, centerY);
      ctx.stroke();

      // Add small dots at the ends
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(canvasWidth * 0.1, centerY, 3, 0, Math.PI * 2);
      ctx.arc(canvasWidth * 0.9, centerY, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    // Cleanup animation frame on unmount
    useEffect(() => {
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    return (
      <div className={cn('inline-block', className)}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          aria-hidden="true"
          className="rounded border border-gray-200"
        />
        {/* Screen reader accessible alternative */}
        <span className="sr-only">
          {isRecording 
            ? `Recording active. Audio level: ${Math.round(audioLevel * 100)}%`
            : 'Recording inactive'
          }
        </span>
      </div>
    );
  }
);

AudioVisualizer.displayName = 'AudioVisualizer';

export default AudioVisualizer;
