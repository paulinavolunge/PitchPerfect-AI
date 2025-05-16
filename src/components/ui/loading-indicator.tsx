
import React from 'react';
import { Loader2 } from 'lucide-react';

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
  const sizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };
  
  const iconSize = {
    small: 16,
    medium: 24,
    large: 32
  };
  
  return (
    <div className={`flex flex-col items-center justify-center py-4 ${className}`} 
         role="status" 
         aria-live="polite">
      <Loader2 className={`animate-spin ${sizeClass[size]} text-brand-blue mb-2`} size={iconSize[size]} />
      {message && <p className={`${sizeClass[size]} text-brand-dark/70`}>{message}</p>}
    </div>
  );
};

export default LoadingIndicator;
