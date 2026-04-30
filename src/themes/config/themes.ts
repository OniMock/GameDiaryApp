export type Theme = 'dark' | 'light';

export interface ThemeConfig {
  name: Theme;
  label: string;
  icon: string;
}

export const THEMES: ThemeConfig[] = [
  { name: 'light', label: 'Light', icon: 'Sun' },
  { name: 'dark', label: 'Dark', icon: 'Moon' },
];

export const DEFAULT_THEME: Theme = 'dark';
