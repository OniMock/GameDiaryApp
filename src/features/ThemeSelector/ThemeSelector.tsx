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
          "relative inline-flex items-center rounded-full transition-all duration-300 focus:outline-none border border-border shadow-inner group",
          sliderSizes[size],
          isDark ? 'bg-foreground/20' : 'bg-foreground/10',
          className
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 transform rounded-full transition-all duration-300 ease-in-out shadow-md flex items-center justify-center",
            thumbSizes[size],
            translateClasses[size],
            isDark ? 'bg-primary' : 'bg-background border border-border'
          )}
        >
          {isDark ? (
            <Moon className={cn(iconSizes[size], "text-primary-foreground")} />
          ) : (
            <Sun className={cn(iconSizes[size], "text-primary")} />
          )}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "rounded-lg p-2 transition-all duration-200 hover:bg-foreground/5 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {isDark ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};
