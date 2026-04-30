import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

interface ThemeSelectorProps {
  variant?: 'slider' | 'button' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * ThemeSelector - Componente principal para alternar entre temas dark/light
 * 
 * Variantes:
 * - 'slider': Toggle slider animado (padrão e mais popular)
 * - 'button': Botão simples com ícone
 * - 'minimal': Apenas ícone, sem fundo
 */
const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = 'slider',
  size = 'md',
  showLabel = false,
  className
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Configurações de tamanho para o slider
  const sliderSizes = {
    sm: 'h-6 w-11',
    md: 'h-8 w-14', 
    lg: 'h-10 w-18'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const thumbSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const translateClasses = {
    sm: isDark ? 'translate-x-5' : 'translate-x-1',
    md: isDark ? 'translate-x-6' : 'translate-x-1', 
    lg: isDark ? 'translate-x-8' : 'translate-x-1'
  };

  // Variante SLIDER - Componente principal (toggle animado)
  if (variant === 'slider') {
    return (
      <div className={cn("flex items-center space-x-3", className)}>
        {showLabel && (
          <span className="text-sm font-medium text-foreground">
            {isDark ? 'DARK' : 'LIGHT'}
          </span>
        )}
        
        {/* Toggle Slider Button */}
        <button
          onClick={toggleTheme}
          className={cn(
            "relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background hover:shadow-lg",
            sliderSizes[size],
            isDark 
              ? 'bg-gradient-to-r from-gray-700 to-gray-800 shadow-inner' 
              : 'bg-gradient-to-r from-gray-200 to-gray-300 shadow-inner'
          )}
          title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        >
          {/* Thumb (círculo que desliza) */}
          <span
            className={cn(
              "inline-block transform rounded-full transition-all duration-300 ease-in-out shadow-md",
              thumbSizes[size],
              translateClasses[size],
              isDark 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600' 
                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            )}
          >
            {/* Ícone dentro do thumb */}
            <span className="flex h-full w-full items-center justify-center">
              {isDark ? (
                <Moon className={cn(iconSizes[size], "text-blue-300 drop-shadow-sm")} />
              ) : (
                <Sun className={cn(iconSizes[size], "text-yellow-500 drop-shadow-sm")} />
              )}
            </span>
          </span>
        </button>

        {showLabel && (
          <span className="text-xs text-muted-foreground font-medium">
            MODE
          </span>
        )}
      </div>
    );
  }

  // Variante BUTTON - Botão simples
  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:scale-105",
          className
        )}
        title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      >
        {isDark ? (
          <Moon className={iconSizes[size]} />
        ) : (
          <Sun className={iconSizes[size]} />
        )}
        {showLabel && <span>{isDark ? 'Dark' : 'Light'}</span>}
      </button>
    );
  }

  // Variante MINIMAL - Apenas ícone
  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "rounded-full p-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:scale-110",
          className
        )}
        title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      >
        {isDark ? (
          <Moon className={iconSizes[size]} />
        ) : (
          <Sun className={iconSizes[size]} />
        )}
      </button>
    );
  }

  return null;
};

export default ThemeSelector;