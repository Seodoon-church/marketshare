'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import type { ThemeDefinition } from '@/types';

interface ThemeContextValue {
  theme: ThemeDefinition;
  mallOverrides: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  theme,
  mallOverrides = {},
}: {
  children: ReactNode;
  theme: ThemeDefinition;
  mallOverrides?: Record<string, string>;
}) {
  useEffect(() => {
    const root = document.documentElement;

    Object.entries(theme.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    Object.entries(mallOverrides).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    root.setAttribute('data-theme', theme.id);

    return () => {
      Object.keys(theme.cssVariables).forEach((key) => {
        root.style.removeProperty(key);
      });
      Object.keys(mallOverrides).forEach((key) => {
        root.style.removeProperty(key);
      });
      root.removeAttribute('data-theme');
    };
  }, [theme, mallOverrides]);

  return (
    <ThemeContext.Provider value={{ theme, mallOverrides }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
