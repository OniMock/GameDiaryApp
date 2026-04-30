import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DEFAULT_THEME } from '../config/themes';
import type { Theme } from '../config/themes';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  const applyTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Manage class for Tailwind dark mode
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Add theme-specific classes
    document.documentElement.setAttribute('data-theme', newTheme);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      applyTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
