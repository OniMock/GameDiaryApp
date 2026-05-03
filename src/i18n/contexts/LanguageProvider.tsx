import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import { LanguageContext } from './LanguageContext';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../lang';
import { getCookie, setCookie } from '../utils/cookies';


const getInitialLanguage = (): string => {
  // 1. Check Cookie
  const savedLanguage = getCookie('language');
  if (savedLanguage && LANGUAGES[savedLanguage as keyof typeof LANGUAGES]) {
    return savedLanguage;
  }

  // 2. Check Browser Language
  const browserLanguage = navigator.language;
  const matched = Object.keys(LANGUAGES).find(code => 
    browserLanguage.toLowerCase().startsWith(code.toLowerCase())
  );
  if (matched) {
    return matched;
  }

  // 3. Fallback to Default (English)
  return DEFAULT_LANGUAGE.config.code;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(getInitialLanguage());

  const availableLanguages = Object.values(LANGUAGES).map((l) => l.config);

  const updateLanguage = useCallback((code: string) => {
    if (LANGUAGES[code as keyof typeof LANGUAGES]) {
      setCurrentLanguage(code);
      setCookie('language', code);
      // Update HTML lang attribute
      document.documentElement.lang = code;
    }
  }, []);

  useEffect(() => {
    // Initial sync of HTML lang attribute
    document.documentElement.lang = currentLanguage;
  }, []);

  const t = useCallback((key: string, variables?: Record<string, string | number>): string => {
    const lang = LANGUAGES[currentLanguage as keyof typeof LANGUAGES] || DEFAULT_LANGUAGE;
    let translation = lang.translations[key];

    if (!translation) {
      // Fallback to English
      translation = LANGUAGES['en'].translations[key];
    }

    if (!translation) {
      return key;
    }

    if (variables) {
      Object.keys(variables).forEach((variable) => {
        translation = translation.replace(
          `{${variable}}`,
          String(variables[variable])
        );
      });
    }

    return translation;
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        availableLanguages,
        setLanguage: updateLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
