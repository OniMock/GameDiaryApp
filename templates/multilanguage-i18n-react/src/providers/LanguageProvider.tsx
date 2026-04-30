import React, { useState, useEffect, ReactNode } from 'react';
import {
  translations as ptBrTranslations,
  languageConfig as ptBrConfig,
} from '../locales/ptBr';
import {
  translations as enTranslations,
  languageConfig as enConfig,
} from '../locales/en';
import {
  translations as esTranslations,
  languageConfig as esConfig,
} from '../locales/es';
import {
  translations as frTranslations,
  languageConfig as frConfig,
} from '../locales/fr';
import {
  translations as deTranslations,
  languageConfig as deConfig,
} from '../locales/de';
import {
  LanguageContext,
  LanguageContextType,
  LanguageConfig,
} from '../contexts/LanguageContext';

interface LanguageFile {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  locale?: string;
  translations: Record<string, unknown>;
}

const languageFiles: Record<string, LanguageFile> = {
  'pt-br': {
    ...ptBrConfig,
    translations: ptBrTranslations,
  },
  en: {
    ...enConfig,
    translations: enTranslations,
  },
  es: {
    ...esConfig,
    translations: esTranslations,
  },
  fr: {
    ...frConfig,
    translations: frTranslations,
  },
  de: {
    ...deConfig,
    translations: deTranslations,
  },
};

const getAvailableLanguages = (): LanguageConfig[] => {
  return Object.values(languageFiles).map((lang) => ({
    code: lang.code,
    name: lang.name,
    nativeName: lang.nativeName,
    flag: lang.flag,
    locale: lang.locale,
  }));
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  useEffect(() => {
    // Recupera idioma do cookie ou usa o idioma do navegador
    const savedLanguage = document.cookie
      .split('; ')
      .find((row) => row.startsWith('language='))
      ?.split('=')[1];

    if (savedLanguage && languageFiles[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    } else {
      // Detecta idioma do navegador
      const browserLanguage = navigator.language.toLowerCase();
      if (browserLanguage.startsWith('pt')) {
        setCurrentLanguage('pt-br');
      } else if (browserLanguage.startsWith('es')) {
        setCurrentLanguage('es');
      } else if (browserLanguage.startsWith('fr')) {
        setCurrentLanguage('fr');
      } else if (browserLanguage.startsWith('de')) {
        setCurrentLanguage('de');
      } else {
        setCurrentLanguage('en');
      }
    }
  }, []);

  const setLanguage = (language: string) => {
    if (languageFiles[language]) {
      setCurrentLanguage(language);
      // Salva no cookie
      document.cookie = `language=${language}; path=/; max-age=31536000`; // 1 ano
    }
  };

  const getNestedValue = (
    obj: Record<string, unknown>,
    path: string
  ): string => {
    return path.split('.').reduce((current: unknown, key: string) => {
      return current &&
        typeof current === 'object' &&
        current !== null &&
        key in current
        ? (current as Record<string, unknown>)[key]
        : null;
    }, obj) as string;
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const currentTranslations = languageFiles[currentLanguage]?.translations;
    const fallbackTranslations = languageFiles['en']?.translations;

    let translation = getNestedValue(currentTranslations, key);

    // Se não encontrar na linguagem atual, tenta no fallback
    if (!translation) {
      translation = getNestedValue(fallbackTranslations, key);
    }

    // Se ainda não encontrar, retorna a chave
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    // Substitui variáveis se fornecidas
    if (variables) {
      Object.keys(variables).forEach((variable) => {
        translation = translation.replace(
          `{{${variable}}}`,
          String(variables[variable])
        );
      });
    }

    return translation;
  };

  const formatDate = (
    date: Date | string, 
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = languageFiles[currentLanguage]?.locale || 'en-US';
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    return dateObj.toLocaleDateString(locale, options || defaultOptions);
  };

  const formatDateTime = (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = languageFiles[currentLanguage]?.locale || 'en-US';
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return dateObj.toLocaleString(locale, options || defaultOptions);
  };

  const formatTime = (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = languageFiles[currentLanguage]?.locale || 'en-US';
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return dateObj.toLocaleTimeString(locale, options || defaultOptions);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        availableLanguages: getAvailableLanguages(),
        setLanguage,
        t,
        formatDate,
        formatDateTime,
        formatTime,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};