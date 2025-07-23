
import { useEffect, useState } from 'react';

export function useTheme() {
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch by only rendering theme-dependent UI after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Always return light mode - no theme switching
  const toggleTheme = () => {
    console.log('Theme switching is disabled - light mode only');
  };

  return { 
    theme: 'light', 
    toggleTheme,
    mounted
  };
}
