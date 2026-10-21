import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import { LanguageContext } from './LanguageContext';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../lang';
import { 
  resolveInitialLanguage, 
  syncDocumentMetadata, 
  getCleanPathname, 
  buildLocalizedPath, 
  getLanguageFromPath 
} from '../utils/routing';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => resolveInitialLanguage());

  const availableLanguages = Object.values(LANGUAGES).map((l) => l.config);

  const updateLanguage = useCallback((code: string) => {
    if (LANGUAGES[code as keyof typeof LANGUAGES]) {
      setCurrentLanguage(code);

      // Compute new localized URL for current clean path
      const currentCleanPath = getCleanPathname(window.location.pathname);
      const hash = window.location.hash;
      const targetPath = buildLocalizedPath(currentCleanPath, code) + hash;

      if (window.location.pathname + window.location.hash !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }

      // Sync DOM title, lang attribute and meta description
      syncDocumentMetadata(code, currentCleanPath);
    }
  }, []);

  // Listen to popstate (browser back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const fromUrl = getLanguageFromPath(window.location.pathname);
      const activeCode = fromUrl || resolveInitialLanguage();
      setCurrentLanguage(activeCode);
      syncDocumentMetadata(activeCode, getCleanPathname(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync DOM on mount and language change
  useEffect(() => {
    syncDocumentMetadata(currentLanguage, getCleanPathname(window.location.pathname));
  }, [currentLanguage]);

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
