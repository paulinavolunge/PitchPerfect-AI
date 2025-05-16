
import { useEffect } from 'react';
import { useTheme as useAppTheme } from '@/context/ThemeContext';

export function useTheme() {
  const { theme, setTheme } = useAppTheme();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return { theme, toggleTheme };
}
