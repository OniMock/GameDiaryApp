export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  locale?: string;
}

export interface LanguageFile {
  config: LanguageConfig;
  translations: Record<string, unknown>;
}