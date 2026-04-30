import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

/**
 * LanguageSelector Component
 * 
 * ⚠️ IMPORTANTE: Este componente deve ser adaptado para seguir o tema do seu site!
 * 
 * Exemplos de adaptação:
 * - Tema escuro: Mantenha as classes atuais (glass-card, text-gray-300)
 * - Tema claro: Use bg-white/80, text-gray-700, border border-gray-200
 * - Múltiplos temas: Implemente lógica condicional baseada no tema ativo
 */
const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, availableLanguages, setLanguage } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentConfig = availableLanguages.find(
    (lang) => lang.code === currentLanguage
  );

  // Sort languages to show the current language first
  const sortedLanguages = [
    ...availableLanguages.filter((lang) => lang.code === currentLanguage),
    ...availableLanguages.filter((lang) => lang.code !== currentLanguage),
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        title={currentConfig?.name}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors duration-300 glass-card hover:bg-white/10 rounded-lg"
      >
        <Globe size={16} />
        <span className="text-sm font-medium">
          <span
            className={`fi fi-${currentConfig?.flag} mr-2`}
            style={{ width: 20, height: 15, borderRadius: 5 }}
          ></span>
          {currentConfig?.code.toUpperCase()}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 min-w-[200px] glass-card p-2 backdrop-blur-md bg-background/70 border-b border-white/10
             animate-fade-in-down"
        >
          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
            {sortedLanguages.map((language, index) => (
              <div key={language.code}>
                {index !== 0 && <div className="h-px bg-white/10 my-1" />}
                <button
                  title={language?.name}
                  onClick={() => {
                    setLanguage(language.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 flex items-center gap-3 ${
                    currentLanguage === language.code
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`fi fi-${language.flag}`}
                    style={{
                      width: '20px',
                      height: '15px',
                      borderRadius: 5,
                      marginRight: 8,
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{language.nativeName}</span>
                    <span className="text-xs text-gray-400">
                      {language.name}
                    </span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;