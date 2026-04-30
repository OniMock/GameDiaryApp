import { createContext } from 'react';
import type { LanguageConfig } from '../types/language';

export interface LanguageContextType {
  currentLanguage: string;
  availableLanguages: LanguageConfig[];
  setLanguage: (lang: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);
