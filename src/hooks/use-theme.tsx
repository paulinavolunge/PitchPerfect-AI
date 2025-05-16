
import { useEffect, useState } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { trackEvent } from '@/utils/analytics';

export function useTheme() {
  const { theme, setTheme, systemTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch by only rendering theme-dependent UI after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Save to localStorage through next-themes (it handles this internally)
    setTheme(newTheme);
    
    // Track theme change event
    trackEvent('dark_mode_toggle', {
      event_category: 'user_preference',
      event_label: newTheme
    });
  };

  // Get the actual theme accounting for system preference
  const resolvedTheme = mounted ? (theme === 'system' ? systemTheme : theme) : undefined;

  return { 
    theme: resolvedTheme, 
    toggleTheme,
    mounted
  };
}
