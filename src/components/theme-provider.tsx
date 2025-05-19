
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Force light mode only, no theme switching
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={false}
      forcedTheme="light" 
      disableTransitionOnChange={false} 
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
