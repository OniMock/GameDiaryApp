// Definições de temas para o sistema
export type ThemeName = 'light' | 'dark' | 'dracula' | 'ocean' | 'forest' | 'sunset' | 'minimal';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface ThemeDefinition {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: 'light' | 'dark';
  colors: ThemeColors;
  cssClass: string;
}

// Definições dos temas disponíveis
export const themes: Record<ThemeName, ThemeDefinition> = {
  // ===== TEMAS LIGHT =====
  light: {
    name: 'light',
    displayName: 'Claro',
    description: 'Tema claro padrão com boa legibilidade',
    icon: '☀️',
    category: 'light',
    cssClass: 'light-theme',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      cardForeground: '222.2 84% 4.9%',
      popover: '0 0% 100%',
      popoverForeground: '222.2 84% 4.9%',
      primary: '221.2 83.2% 53.3%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96%',
      secondaryForeground: '222.2 84% 4.9%',
      muted: '210 40% 96%',
      mutedForeground: '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      accentForeground: '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '221.2 83.2% 53.3%',
      chart1: '12 76% 61%',
      chart2: '173 58% 39%',
      chart3: '197 37% 24%',
      chart4: '43 74% 66%',
      chart5: '27 87% 67%'
    }
  },

  minimal: {
    name: 'minimal',
    displayName: 'Minimal',
    description: 'Tema minimalista com cores neutras',
    icon: '⚪',
    category: 'light',
    cssClass: 'minimal-theme',
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 10%',
      card: '0 0% 98%',
      cardForeground: '0 0% 10%',
      popover: '0 0% 98%',
      popoverForeground: '0 0% 10%',
      primary: '210 100% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '0 0% 96%',
      secondaryForeground: '0 0% 10%',
      muted: '0 0% 96%',
      mutedForeground: '0 0% 50%',
      accent: '0 0% 96%',
      accentForeground: '0 0% 10%',
      destructive: '0 100% 50%',
      destructiveForeground: '0 0% 100%',
      border: '0 0% 90%',
      input: '0 0% 90%',
      ring: '210 100% 50%',
      chart1: '210 100% 50%',
      chart2: '120 100% 40%',
      chart3: '0 100% 50%',
      chart4: '60 100% 50%',
      chart5: '300 100% 50%'
    }
  },

  // ===== TEMAS DARK =====
  dark: {
    name: 'dark',
    displayName: 'Escuro',
    description: 'Tema escuro padrão para reduzir cansaço visual',
    icon: '🌙',
    category: 'dark',
    cssClass: 'dark-theme',
    colors: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      cardForeground: '210 40% 98%',
      popover: '222.2 84% 4.9%',
      popoverForeground: '210 40% 98%',
      primary: '217.2 91.2% 59.8%',
      primaryForeground: '222.2 84% 4.9%',
      secondary: '217.2 32.6% 17.5%',
      secondaryForeground: '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      mutedForeground: '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      accentForeground: '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '217.2 91.2% 59.8%',
      chart1: '220 70% 50%',
      chart2: '160 60% 45%',
      chart3: '30 80% 55%',
      chart4: '280 65% 60%',
      chart5: '340 75% 55%'
    }
  },

  dracula: {
    name: 'dracula',
    displayName: 'Dracula',
    description: 'Tema escuro inspirado no Dracula com acentos roxos',
    icon: '🧛',
    category: 'dark',
    cssClass: 'dracula-theme',
    colors: {
      background: '231 15% 18%',
      foreground: '60 30% 96%',
      card: '232 14% 31%',
      cardForeground: '60 30% 96%',
      popover: '232 14% 31%',
      popoverForeground: '60 30% 96%',
      primary: '265 89% 78%',
      primaryForeground: '231 15% 18%',
      secondary: '232 14% 31%',
      secondaryForeground: '60 30% 96%',
      muted: '232 14% 31%',
      mutedForeground: '226 14% 70%',
      accent: '232 14% 31%',
      accentForeground: '60 30% 96%',
      destructive: '0 100% 67%',
      destructiveForeground: '60 30% 96%',
      border: '232 14% 31%',
      input: '232 14% 31%',
      ring: '265 89% 78%',
      chart1: '265 89% 78%',
      chart2: '135 94% 65%',
      chart3: '326 100% 74%',
      chart4: '65 92% 76%',
      chart5: '31 100% 71%'
    }
  },

  ocean: {
    name: 'ocean',
    displayName: 'Ocean',
    description: 'Tema escuro com tons de azul oceânico',
    icon: '🌊',
    category: 'dark',
    cssClass: 'ocean-theme',
    colors: {
      background: '200 50% 10%',
      foreground: '180 100% 90%',
      card: '200 50% 15%',
      cardForeground: '180 100% 90%',
      popover: '200 50% 15%',
      popoverForeground: '180 100% 90%',
      primary: '180 100% 50%',
      primaryForeground: '200 50% 10%',
      secondary: '200 50% 20%',
      secondaryForeground: '180 100% 90%',
      muted: '200 50% 20%',
      mutedForeground: '180 50% 70%',
      accent: '200 50% 20%',
      accentForeground: '180 100% 90%',
      destructive: '0 100% 60%',
      destructiveForeground: '180 100% 90%',
      border: '200 50% 25%',
      input: '200 50% 25%',
      ring: '180 100% 50%',
      chart1: '180 100% 50%',
      chart2: '200 100% 60%',
      chart3: '220 100% 70%',
      chart4: '160 100% 40%',
      chart5: '240 100% 60%'
    }
  },

  forest: {
    name: 'forest',
    displayName: 'Forest',
    description: 'Tema escuro com tons de verde floresta',
    icon: '🌲',
    category: 'dark',
    cssClass: 'forest-theme',
    colors: {
      background: '120 25% 15%',
      foreground: '120 20% 90%',
      card: '120 25% 20%',
      cardForeground: '120 20% 90%',
      popover: '120 25% 20%',
      popoverForeground: '120 20% 90%',
      primary: '120 60% 50%',
      primaryForeground: '120 25% 15%',
      secondary: '120 25% 25%',
      secondaryForeground: '120 20% 90%',
      muted: '120 25% 25%',
      mutedForeground: '120 15% 70%',
      accent: '120 25% 25%',
      accentForeground: '120 20% 90%',
      destructive: '0 80% 55%',
      destructiveForeground: '120 20% 90%',
      border: '120 25% 30%',
      input: '120 25% 30%',
      ring: '120 60% 50%',
      chart1: '120 60% 50%',
      chart2: '140 60% 45%',
      chart3: '100 60% 55%',
      chart4: '80 60% 60%',
      chart5: '160 60% 40%'
    }
  },

  sunset: {
    name: 'sunset',
    displayName: 'Sunset',
    description: 'Tema escuro com tons quentes de pôr do sol',
    icon: '🌅',
    category: 'dark',
    cssClass: 'sunset-theme',
    colors: {
      background: '20 30% 15%',
      foreground: '30 20% 90%',
      card: '20 30% 20%',
      cardForeground: '30 20% 90%',
      popover: '20 30% 20%',
      popoverForeground: '30 20% 90%',
      primary: '30 100% 60%',
      primaryForeground: '20 30% 15%',
      secondary: '20 30% 25%',
      secondaryForeground: '30 20% 90%',
      muted: '20 30% 25%',
      mutedForeground: '30 15% 70%',
      accent: '20 30% 25%',
      accentForeground: '30 20% 90%',
      destructive: '0 85% 60%',
      destructiveForeground: '30 20% 90%',
      border: '20 30% 30%',
      input: '20 30% 30%',
      ring: '30 100% 60%',
      chart1: '30 100% 60%',
      chart2: '15 100% 55%',
      chart3: '45 100% 65%',
      chart4: '0 100% 60%',
      chart5: '60 100% 50%'
    }
  }
};

// Função para obter tema por nome
export const getTheme = (name: ThemeName): ThemeDefinition => {
  return themes[name];
};

// Função para obter todos os temas de uma categoria
export const getThemesByCategory = (category: 'light' | 'dark'): ThemeDefinition[] => {
  return Object.values(themes).filter(theme => theme.category === category);
};

// Função para obter lista de nomes de temas
export const getThemeNames = (): ThemeName[] => {
  return Object.keys(themes) as ThemeName[];
};

// Função para gerar CSS customizado para um tema
export const generateThemeCSS = (theme: ThemeDefinition): string => {
  const { colors, cssClass } = theme;
  
  return `
.${cssClass} {
  --background: ${colors.background};
  --foreground: ${colors.foreground};
  --card: ${colors.card};
  --card-foreground: ${colors.cardForeground};
  --popover: ${colors.popover};
  --popover-foreground: ${colors.popoverForeground};
  --primary: ${colors.primary};
  --primary-foreground: ${colors.primaryForeground};
  --secondary: ${colors.secondary};
  --secondary-foreground: ${colors.secondaryForeground};
  --muted: ${colors.muted};
  --muted-foreground: ${colors.mutedForeground};
  --accent: ${colors.accent};
  --accent-foreground: ${colors.accentForeground};
  --destructive: ${colors.destructive};
  --destructive-foreground: ${colors.destructiveForeground};
  --border: ${colors.border};
  --input: ${colors.input};
  --ring: ${colors.ring};
  --chart-1: ${colors.chart1};
  --chart-2: ${colors.chart2};
  --chart-3: ${colors.chart3};
  --chart-4: ${colors.chart4};
  --chart-5: ${colors.chart5};
}`;
};

// Função para gerar CSS de todos os temas
export const generateAllThemesCSS = (): string => {
  return Object.values(themes)
    .map(theme => generateThemeCSS(theme))
    .join('\n\n');
};

// Configurações padrão
export const defaultTheme: ThemeName = 'dark';
export const defaultLightTheme: ThemeName = 'light';
export const defaultDarkTheme: ThemeName = 'dark';