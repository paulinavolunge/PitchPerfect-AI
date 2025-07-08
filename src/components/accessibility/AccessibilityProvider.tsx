
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'normal' | 'large' | 'xl';
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setFontSize: (size: 'normal' | 'large' | 'xl') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(() => {
    const saved = localStorage.getItem('accessibility-high-contrast');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [reducedMotion, setReducedMotion] = useState(() => {
    const saved = localStorage.getItem('accessibility-reduced-motion');
    const systemPreference = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return saved ? JSON.parse(saved) : systemPreference;
  });
  
  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'xl'>(() => {
    const saved = localStorage.getItem('accessibility-font-size');
    return saved ? JSON.parse(saved) : 'normal';
  });

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
  };

  const toggleReducedMotion = () => {
    setReducedMotion(!reducedMotion);
  };

  const setFontSize = (size: 'normal' | 'large' | 'xl') => {
    setFontSizeState(size);
  };

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('accessibility-high-contrast', JSON.stringify(highContrast));
  }, [highContrast]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    localStorage.setItem('accessibility-reduced-motion', JSON.stringify(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Font size
    root.classList.remove('font-large', 'font-xl');
    if (fontSize === 'large') {
      root.classList.add('font-large');
    } else if (fontSize === 'xl') {
      root.classList.add('font-xl');
    }
    localStorage.setItem('accessibility-font-size', JSON.stringify(fontSize));
  }, [fontSize]);

  const value = {
    highContrast,
    reducedMotion,
    fontSize,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};
