import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '@/context/ThemeContext';

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'light',
      isDark: false,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
};
