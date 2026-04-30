import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

/**
 * Hook personalizado para acessar o contexto de tema
 * Fornece acesso a todas as funcionalidades de tema
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

/**
 * Hook para verificar se o tema atual é escuro
 * @returns boolean - true se o tema for dark
 */
export const useIsDark = () => {
  const { theme } = useTheme();
  return theme === 'dark';
};

/**
 * Hook para verificar se o tema atual é claro
 * @returns boolean - true se o tema for light
 */
export const useIsLight = () => {
  const { theme } = useTheme();
  return theme === 'light';
};

/**
 * Hook para obter informações detalhadas do tema atual
 * @returns objeto com informações do tema (nome, descrição, ícone, etc.)
 */
export const useThemeInfo = () => {
  const { theme } = useTheme();
  
  const themeInfo = {
    dark: {
      name: 'Escuro',
      description: 'Tema escuro para reduzir cansaço visual',
      icon: '🌙',
      class: 'dark-theme',
      primary: '#3b82f6',
      background: '#0f172a'
    },
    light: {
      name: 'Claro', 
      description: 'Tema claro para melhor visibilidade',
      icon: '☀️',
      class: 'light-theme',
      primary: '#2563eb',
      background: '#ffffff'
    }
  };
  
  return themeInfo[theme];
};

/**
 * Hook para detectar preferência de tema do sistema
 * @returns 'dark' | 'light' | null
 */
export const useSystemTheme = () => {
  if (typeof window === 'undefined') return null;
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
};

/**
 * Hook para sincronizar tema com preferência do sistema
 * @param autoSync - se deve sincronizar automaticamente
 */
export const useSystemThemeSync = (autoSync: boolean = false) => {
  const { setTheme } = useTheme();
  const systemTheme = useSystemTheme();
  
  const syncWithSystem = () => {
    if (systemTheme) {
      setTheme(systemTheme);
    }
  };
  
  // Auto sync se habilitado
  if (autoSync && systemTheme) {
    setTheme(systemTheme);
  }
  
  return { syncWithSystem, systemTheme };
};

/**
 * Hook para aplicar classe CSS baseada no tema
 * @param lightClass - classe para tema claro
 * @param darkClass - classe para tema escuro
 * @returns string com a classe apropriada
 */
export const useThemeClass = (lightClass: string, darkClass: string) => {
  const { theme } = useTheme();
  return theme === 'dark' ? darkClass : lightClass;
};

/**
 * Hook para obter valor baseado no tema
 * @param lightValue - valor para tema claro
 * @param darkValue - valor para tema escuro
 * @returns valor apropriado para o tema atual
 */
export const useThemeValue = <T>(lightValue: T, darkValue: T): T => {
  const { theme } = useTheme();
  return theme === 'dark' ? darkValue : lightValue;
};

/**
 * Hook para animações de transição de tema
 * @returns funções para controlar animações
 */
export const useThemeTransition = () => {
  const addTransitionClass = (element: HTMLElement, className: string = 'theme-changing') => {
    element.classList.add(className);
    setTimeout(() => {
      element.classList.remove(className);
    }, 300);
  };
  
  const addGlobalTransition = () => {
    document.body.classList.add('theme-changing');
    setTimeout(() => {
      document.body.classList.remove('theme-changing');
    }, 300);
  };
  
  return { addTransitionClass, addGlobalTransition };
};

/**
 * Hook para persistência de tema
 * @returns funções para salvar/carregar tema
 */
export const useThemePersistence = () => {
  const saveTheme = (theme: string) => {
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('Não foi possível salvar o tema:', error);
    }
  };
  
  const loadTheme = (): string | null => {
    try {
      return localStorage.getItem('theme');
    } catch (error) {
      console.warn('Não foi possível carregar o tema:', error);
      return null;
    }
  };
  
  const clearTheme = () => {
    try {
      localStorage.removeItem('theme');
    } catch (error) {
      console.warn('Não foi possível limpar o tema:', error);
    }
  };
  
  return { saveTheme, loadTheme, clearTheme };
};

/**
 * Hook para controle avançado de tema com callbacks
 * @param onThemeChange - callback executado quando tema muda
 * @returns objeto com controles de tema
 */
export const useAdvancedTheme = (onThemeChange?: (theme: string) => void) => {
  const { theme, setTheme, toggleTheme, availableThemes } = useTheme();
  const { addGlobalTransition } = useThemeTransition();
  
  const setThemeWithAnimation = (newTheme: any) => {
    addGlobalTransition();
    setTheme(newTheme);
    onThemeChange?.(newTheme);
  };
  
  const toggleThemeWithAnimation = () => {
    addGlobalTransition();
    toggleTheme();
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    onThemeChange?.(newTheme);
  };
  
  return {
    theme,
    setTheme: setThemeWithAnimation,
    toggleTheme: toggleThemeWithAnimation,
    availableThemes,
    currentThemeInfo: useThemeInfo()
  };
};