import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../themes/hooks/useTheme';
import { cn } from '../../shared/lib/utils';

interface ThemeSelectorProps {
  variant?: 'slider' | 'button';
  size?: 'sm' | 'md';
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = 'slider',
  size = 'md',
  className
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const sliderSizes = {
    sm: 'h-6 w-11',
    md: 'h-8 w-14', 
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  };

  const thumbSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
  };

  const translateClasses = {
    sm: isDark ? 'translate-x-[1.25rem]' : 'translate-x-[0.25rem]', 
    md: isDark ? 'translate-x-[1.5rem]' : 'translate-x-[0.25rem]', 
  };

  if (variant === 'slider') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "relative inline-flex items-center rounded-full transition-colors duration-500 ease-in-out focus:outline-none border border-white/10",
          sliderSizes[size],
          isDark ? 'bg-white/10' : 'bg-white/20',
          className
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 transform rounded-full transition-all duration-300 ease-in-out shadow-lg flex items-center justify-center",
            thumbSizes[size],
            translateClasses[size],
            isDark ? 'bg-[#3B82F6]' : 'bg-white'
          )}
        >
          {isDark ? (
            <Moon className={cn(iconSizes[size], "text-white")} />
          ) : (
            <Sun className={cn(iconSizes[size], "text-[#1E3A8A]")} />
          )}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "rounded-lg p-2 transition-all duration-200 hover:bg-white/10 text-white/70 hover:text-white",
        className
      )}
    >
      {isDark ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};
