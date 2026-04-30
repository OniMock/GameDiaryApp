import { Settings, Palette, Monitor, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { useTheme, useThemeInfo } from '../contexts/ThemeContext';
import ThemeSelector from './ThemeSelector';

interface SettingsMenuProps {
  position?: 'left' | 'right';
  showLanguageSelector?: boolean;
  customContent?: React.ReactNode;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ 
  position = 'right',
  showLanguageSelector = false,
  customContent 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme, availableThemes } = useTheme();
  const themeInfo = useThemeInfo();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={toggleMenu}
        className="relative p-2 rounded-lg bg-accent hover:bg-accent/80 text-foreground hover:text-primary transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Abrir configurações"
      >
        <Settings className="w-5 h-5 transition-transform duration-200 hover:rotate-90" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 ${position === 'right' ? 'right-0' : 'left-0'} h-full w-80 max-w-[90vw]
          bg-card border-l border-border shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : position === 'right' ? 'translate-x-full' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Configurações
          </h2>
          <button
            onClick={closeMenu}
            className="p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Fechar configurações"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto h-full pb-20">
          
          {/* Theme Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              Aparência
            </h3>
            
            {/* Current Theme Info */}
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Tema Atual</span>
                <span className="text-lg">{themeInfo.icon}</span>
              </div>
              <div className="text-sm font-medium text-foreground mb-1">
                {themeInfo.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {themeInfo.description}
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-center p-4 bg-accent/30 rounded-lg">
              <ThemeSelector variant="toggle" size="md" />
            </div>

            {/* Theme Options */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Opções de Tema
              </span>
              
              {availableThemes.map((themeOption) => (
                <button
                  key={themeOption}
                  onClick={() => setTheme(themeOption)}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200
                    ${theme === themeOption 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'bg-accent/50 hover:bg-accent text-foreground hover:scale-[1.02]'
                    }
                  `}
                >
                  <div className="flex items-center">
                    {themeOption === 'dark' ? (
                      <Moon className="w-4 h-4 mr-3" />
                    ) : (
                      <Sun className="w-4 h-4 mr-3" />
                    )}
                    <span className="font-medium">
                      {themeOption === 'dark' ? 'Escuro' : 'Claro'}
                    </span>
                  </div>
                  {theme === themeOption && (
                    <div className="w-2 h-2 bg-current rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* System Preference */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground flex items-center">
              <Monitor className="w-4 h-4 mr-2" />
              Sistema
            </h3>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">
                Preferência do Sistema
              </div>
              <div className="text-sm text-foreground">
                {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Escuro' : 'Claro'}
              </div>
            </div>
          </div>

          {/* Custom Content */}
          {customContent && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                Configurações Adicionais
              </h3>
              {customContent}
            </div>
          )}

          {/* Language Selector (if enabled) */}
          {showLanguageSelector && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                Idioma
              </h3>
              <div className="text-sm text-muted-foreground">
                Seletor de idioma pode ser adicionado aqui
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="pt-6 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              <p>Sistema de Temas v1.0</p>
              <p className="mt-1">Transições suaves entre temas</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsMenu;