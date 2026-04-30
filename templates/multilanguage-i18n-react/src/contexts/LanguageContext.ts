import { createContext } from 'react';

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  locale?: string;
}

export interface LanguageContextType {
  currentLanguage: string;
  availableLanguages: LanguageConfig[];
  setLanguage: (lang: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);