
import React from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Simplified theme provider - light mode only
  return <>{children}</>;
}
