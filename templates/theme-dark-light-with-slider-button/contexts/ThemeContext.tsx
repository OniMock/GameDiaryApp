import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipos de tema disponíveis - pode ser expandido facilmente
type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const availableThemes: Theme[] = ['dark', 'light'];

  useEffect(() => {
    // Verifica se há tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && availableThemes.includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      // Detecta preferência do sistema se não houver tema salvo
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    // Salva preferência do tema e aplica ao documento
    localStorage.setItem('theme', theme);
    
    // Remove classes de tema existentes
    availableThemes.forEach(t => {
      document.documentElement.classList.remove(`${t}-theme`);
      document.body.classList.remove(`${t}-theme`);
    });
    
    // Aplica a nova classe de tema
    const themeClass = `${theme}-theme`;
    document.documentElement.classList.add(themeClass);
    document.body.classList.add(themeClass);
    
    // Define atributo data para estilização adicional
    document.documentElement.setAttribute('data-theme', theme);
    
    // Adiciona classe para Tailwind CSS (compatibilidade)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    console.log('🎨 Tema aplicado:', theme);
  }, [theme, availableThemes]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

// Hook personalizado para verificar se é tema escuro
export const useIsDark = () => {
  const { theme } = useTheme();
  return theme === 'dark';
};

// Hook personalizado para obter informações do tema atual
export const useThemeInfo = () => {
  const { theme } = useTheme();
  
  const themeInfo = {
    dark: {
      name: 'Escuro',
      description: 'Tema escuro para reduzir cansaço visual',
      icon: '🌙'
    },
    light: {
      name: 'Claro',
      description: 'Tema claro para melhor visibilidade',
      icon: '☀️'
    }
  };
  
  return themeInfo[theme];
};