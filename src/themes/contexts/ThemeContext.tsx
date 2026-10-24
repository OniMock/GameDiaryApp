import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DEFAULT_THEME } from '../config/themes';
import type { Theme } from '../config/themes';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch {
    return DEFAULT_THEME;
  }
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const applyTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch {
      // Ignore private browsing storage errors
    }
    
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
    // Ensure document attributes are synchronized on mount
    applyTheme(theme);

    // Listen for system theme changes if user has not explicitly set a theme
    const mediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;

    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      } catch {}
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [applyTheme, theme]);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
