import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageProvider';

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, availableLanguages, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangConfig = availableLanguages.find(
    (lang) => lang.code === currentLanguage
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-lg">{currentLangConfig?.flag}</span>
        <span className="hidden sm:inline">{currentLangConfig?.name}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="py-1" role="listbox">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors ${
                  currentLanguage === lang.code
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700'
                }`}
                role="option"
                aria-selected={currentLanguage === lang.code}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{lang.name}</span>
                  <span className="text-xs text-gray-500">{lang.nativeName}</span>
                </div>
                {currentLanguage === lang.code && (
                  <span className="ml-auto text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};