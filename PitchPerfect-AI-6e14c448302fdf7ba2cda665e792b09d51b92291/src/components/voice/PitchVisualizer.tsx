
import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { PitchData } from '@/types/pitch';

interface PitchVisualizerProps {
  pitchHistory: PitchData[];
  width?: number;
  height?: number;
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
  showGrid?: boolean;
  minFrequency?: number;
  maxFrequency?: number;
}

export const PitchVisualizer: React.FC<PitchVisualizerProps> = ({
  pitchHistory,
  width = 400,
  height = 200,
  className,
  strokeColor = '#3b82f6',
  strokeWidth = 2,
  showGrid = true,
  minFrequency = 80,
  maxFrequency = 800
}) => {
  const pathData = useMemo(() => {
    if (pitchHistory.length === 0) return '';

    const validPitches = pitchHistory.filter(p => p.frequency > 0 && p.confidence > 0.3);
    if (validPitches.length === 0) return '';

    const points = validPitches.map((pitch, index) => {
      const x = (index / Math.max(validPitches.length - 1, 1)) * width;
      // Normalize frequency to height (inverted y-axis)
      const normalizedFreq = Math.max(0, Math.min(1, 
        (pitch.frequency - minFrequency) / (maxFrequency - minFrequency)
      ));
      const y = height - (normalizedFreq * height);
      return `${x},${y}`;
    });

    return points.join(' ');
  }, [pitchHistory, width, height, minFrequency, maxFrequency]);

  const gridLines = useMemo(() => {
    if (!showGrid) return null;

    const horizontalLines = [];
    const verticalLines = [];
    
    // Horizontal frequency grid lines
    const freqStep = (maxFrequency - minFrequency) / 4;
    for (let i = 0; i <= 4; i++) {
      const freq = minFrequency + (freqStep * i);
      const y = height - ((freq - minFrequency) / (maxFrequency - minFrequency)) * height;
      horizontalLines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          strokeDasharray="2,2"
        />
      );
    }
    
    // Vertical time grid lines
    for (let i = 0; i <= 4; i++) {
      const x = (i / 4) * width;
      verticalLines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          strokeDasharray="2,2"
        />
      );
    }
    
    return [...horizontalLines, ...verticalLines];
  }, [showGrid, width, height, minFrequency, maxFrequency]);

  const currentPitch = pitchHistory[pitchHistory.length - 1];

  return (
    <div className={cn('relative', className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="border border-gray-200 rounded bg-white"
        aria-label="Pitch visualization"
      >
        {/* Grid */}
        {gridLines}
        
        {/* Pitch contour */}
        {pathData && (
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pathData}
            opacity={0.8}
          />
        )}
        
        {/* Current pitch indicator */}
        {currentPitch && currentPitch.frequency > 0 && (
          <circle
            cx={width - 5}
            cy={height - ((currentPitch.frequency - minFrequency) / (maxFrequency - minFrequency)) * height}
            r={3}
            fill={strokeColor}
            opacity={currentPitch.confidence}
          />
        )}
      </svg>
      
      {/* Frequency labels */}
      {showGrid && (
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pointer-events-none">
          <span>{maxFrequency}Hz</span>
          <span>{Math.round((maxFrequency + minFrequency) / 2)}Hz</span>
          <span>{minFrequency}Hz</span>
        </div>
      )}
      
      {/* Current pitch display */}
      {currentPitch && currentPitch.frequency > 0 && (
        <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-mono">
          {Math.round(currentPitch.frequency)}Hz
          <span className="ml-1 text-gray-500">
            ({Math.round(currentPitch.confidence * 100)}%)
          </span>
        </div>
      )}
      
      {/* No data message */}
      {pitchHistory.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          No pitch data
        </div>
      )}
    </div>
  );
};

export default PitchVisualizer;
