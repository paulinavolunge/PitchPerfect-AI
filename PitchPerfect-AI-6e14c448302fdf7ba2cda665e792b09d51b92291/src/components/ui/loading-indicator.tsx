
import React from 'react';
import LoadingWave from './loading-wave';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = 'Analyzing your response...', 
  size = 'medium',
  className = ''
}) => {
  return (
    <LoadingWave
      message={message}
      size={size}
      className={className}
      color="#008D95"
      logoColor="#4A90E6"
    />
  );
};

export default LoadingIndicator;
