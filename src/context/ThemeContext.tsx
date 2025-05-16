import React, { createContext, useContext } from 'react';

// This is now just a wrapper around next-themes
// We keep it to maintain compatibility with existing code

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // This is now just a compatibility layer - actual theme handling is in next-themes
  return (
    <ThemeContext.Provider value={{ theme: 'system', setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a dummy implementation since we're using next-themes now
    return {
      theme: 'system',
      setTheme: () => {}
    };
  }
  return context;
};
