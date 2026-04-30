import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getCookie, setCookie } from '../utils/cookies';
import * as ptBr from '../locales/ptBr';
import * as en from '../locales/en';

// Interfaces
interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface LanguageFile {
  config: LanguageConfig;
  translations: Record<string, any>;
}

interface LanguageContextType {
  currentLanguage: string;
  availableLanguages: LanguageConfig[];
  setLanguage: (lang: string) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

// Language files registry
const languageFiles: Record<string, LanguageFile> = {
  'pt-BR': { config: ptBr.languageConfig, translations: ptBr.translations },
  'en': { config: en.languageConfig, translations: en.translations },
};

// Context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Constants
const LANGUAGE_COOKIE = 'language-preference';
const DEFAULT_LANGUAGE = 'en';

// Helper functions
const detectBrowserLanguage = (): string => {
  const browserLang = navigator.language || navigator.languages?.[0];
  if (!browserLang) return DEFAULT_LANGUAGE;

  const availableLanguages = Object.keys(languageFiles);
  
  // Try exact match first
  const exactMatch = availableLanguages.find(
    (lang) => lang.toLowerCase() === browserLang.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // Try prefix match (e.g., 'pt-BR' -> 'pt')
  const langPrefix = browserLang.split('-')[0].toLowerCase();
  const prefixMatch = availableLanguages.find((lang) =>
    lang.toLowerCase().startsWith(langPrefix)
  );
  if (prefixMatch) return prefixMatch;

  return DEFAULT_LANGUAGE;
};

const getNestedValue = (obj: any, path: string): string => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

// Provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    const savedLanguage = getCookie(LANGUAGE_COOKIE);
    const availableLanguages = Object.keys(languageFiles);

    if (savedLanguage && availableLanguages.includes(savedLanguage)) {
      return savedLanguage;
    }

    const browserLang = detectBrowserLanguage();
    if (availableLanguages.includes(browserLang)) {
      return browserLang;
    }

    return availableLanguages.includes(DEFAULT_LANGUAGE)
      ? DEFAULT_LANGUAGE
      : availableLanguages[0];
  });

  const setLanguage = (lang: string) => {
    if (languageFiles[lang]) {
      setCurrentLanguage(lang);
      setCookie(LANGUAGE_COOKIE, lang, 365); // 1 year expiry
    }
  };

  const t = (key: string, vars?: Record<string, string>): string => {
    const currentTranslations = languageFiles[currentLanguage]?.translations || {};
    const fallbackTranslations = languageFiles[DEFAULT_LANGUAGE]?.translations || {};

    // Try to get translation from current language
    let translation = getNestedValue(currentTranslations, key);
    
    // If not found, try fallback language
    if (!translation && currentLanguage !== DEFAULT_LANGUAGE) {
      translation = getNestedValue(fallbackTranslations, key);
    }
    
    // If still not found, return the key itself
    if (!translation) {
      translation = key;
    }

    // Replace variables if provided
    if (vars && typeof translation === 'string') {
      return Object.entries(vars).reduce(
        (acc, [varKey, varValue]) =>
          acc.replace(new RegExp(`\\{\\{${varKey}\\}\\}`, 'g'), String(varValue)),
        translation
      );
    }

    return String(translation);
  };

  const getAvailableLanguages = (): LanguageConfig[] => {
    return Object.values(languageFiles).map(file => file.config);
  };

  const value: LanguageContextType = {
    currentLanguage,
    availableLanguages: getAvailableLanguages(),
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
