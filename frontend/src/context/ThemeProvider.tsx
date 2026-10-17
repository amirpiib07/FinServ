import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeContext, type Theme, type ThemeContextValue } from './ThemeContext';

const THEME_STORAGE_KEY = 'finserv_theme';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  } catch {
    return 'light';
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      document.documentElement.style.colorScheme = newTheme;
    }
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch {
        // Ignore quota/access errors in restricted environments
      }
      applyTheme(newTheme);
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Synchronize on mount and handle system preference changes if no manual override
  useEffect(() => {
    applyTheme(theme);

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (!stored) {
          const sysTheme: Theme = e.matches ? 'dark' : 'light';
          setThemeState(sysTheme);
          applyTheme(sysTheme);
        }
      } catch {
        // Ignore
      }
    };

    mediaQuery.addEventListener?.('change', handleSystemChange);
    return () => {
      mediaQuery.removeEventListener?.('change', handleSystemChange);
    };
  }, [theme, applyTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
