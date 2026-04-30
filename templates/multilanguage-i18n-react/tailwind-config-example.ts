// Exemplo de configuração do Tailwind CSS para o sistema i18n
// Adicione estas configurações ao seu tailwind.config.ts

import type { Config } from 'tailwindcss';
import scrollbar from 'tailwind-scrollbar';
import animate from 'tailwindcss-animate';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    // Adicione outros caminhos conforme necessário
  ],
  theme: {
    extend: {
      // Animações personalizadas para o seletor de idiomas
      animation: {
        'fade-in-down': 'fade-in-down 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.2s ease-out',
      },
      keyframes: {
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      // Cores personalizadas para o tema
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // Adicione outras cores conforme necessário
      },
      // Backdrop blur para efeito glass
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [animate, scrollbar],
};

export default config;

// CSS Variables para usar com as cores (adicione ao seu CSS global)
/*
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
*/
