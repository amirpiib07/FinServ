import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  className?: string;
  variant?: 'minimal' | 'pill' | 'glass';
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'glass',
  size = 'md',
}) => {
  const { toggleTheme, isDark } = useTheme();

  const isSmall = size === 'sm';
  const buttonSize = isSmall ? '34px' : '38px';
  const iconSize = isSmall ? 16 : 18;

  const nextThemeLabel = isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle theme-toggle--${variant} ${className}`.trim()}
      aria-label={nextThemeLabel}
      title={nextThemeLabel}
      style={{
        width: buttonSize,
        height: buttonSize,
        minWidth: buttonSize,
        borderRadius: 'var(--radius-full)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer',
        padding: 0,
        transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isDark ? 'rotate(180deg) scale(1)' : 'rotate(0deg) scale(1)',
          transition: 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {isDark ? (
          <Moon size={iconSize} className="theme-toggle-icon moon-icon" style={{ color: '#F59E0B' }} />
        ) : (
          <Sun size={iconSize} className="theme-toggle-icon sun-icon" style={{ color: '#F59E0B' }} />
        )}
      </span>
    </button>
  );
};
