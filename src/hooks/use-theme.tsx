
import { useState, useEffect } from 'react';

export function useTheme() {
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch by only rendering theme-dependent UI after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // This function now does nothing as we've disabled theme switching
  const toggleTheme = () => {
    // No theme toggling in light-only mode
    console.log('Theme switching is disabled - light mode only');
  };

  return { 
    theme: 'light', 
    toggleTheme,
    mounted
  };
}
