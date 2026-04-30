import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./template/**/*.{ts,tsx}", // Incluir arquivos do template
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // Cores do sistema de design
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        // Cores específicas para sidebar
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        // Cores para charts
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        // Animações do Accordion
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        // Animações personalizadas para temas
        'theme-fade-in': {
          from: {
            opacity: '0'
          },
          to: {
            opacity: '1'
          }
        },
        'theme-slide-in': {
          from: {
            transform: 'translateY(-10px)',
            opacity: '0'
          },
          to: {
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        'sidebar-slide-in': {
          from: {
            transform: 'translateX(100%)'
          },
          to: {
            transform: 'translateX(0)'
          }
        },
        'sidebar-slide-out': {
          from: {
            transform: 'translateX(0)'
          },
          to: {
            transform: 'translateX(100%)'
          }
        },
        'bounce-subtle': {
          '0%, 100%': {
            transform: 'translateY(0)'
          },
          '50%': {
            transform: 'translateY(-4px)'
          }
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 5px hsl(var(--primary) / 0.5)'
          },
          '50%': {
            boxShadow: '0 0 20px hsl(var(--primary) / 0.8)'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'theme-fade-in': 'theme-fade-in 0.3s ease-out',
        'theme-slide-in': 'theme-slide-in 0.3s ease-out',
        'sidebar-slide-in': 'sidebar-slide-in 0.3s ease-out',
        'sidebar-slide-out': 'sidebar-slide-out 0.3s ease-out',
        'bounce-subtle': 'bounce-subtle 2s infinite',
        'pulse-glow': 'pulse-glow 2s infinite'
      },
      // Transições personalizadas
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'theme': 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      // Durações de transição
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms'
      },
      // Spacing personalizado
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      // Tamanhos personalizados
      width: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      height: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      // Z-index personalizado
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      },
      // Backdrop blur personalizado
      backdropBlur: {
        xs: '2px'
      },
      // Box shadow personalizado
      boxShadow: {
        'theme': '0 4px 6px -1px hsl(var(--foreground) / 0.1), 0 2px 4px -1px hsl(var(--foreground) / 0.06)',
        'theme-lg': '0 10px 15px -3px hsl(var(--foreground) / 0.1), 0 4px 6px -2px hsl(var(--foreground) / 0.05)',
        'glow': '0 0 20px hsl(var(--primary) / 0.3)',
        'glow-lg': '0 0 40px hsl(var(--primary) / 0.4)'
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    // Plugin personalizado para utilitários de tema
    function({ addUtilities, theme }: any) {
      const newUtilities = {
        '.theme-transition': {
          transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        '.theme-transition-fast': {
          transition: 'background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), color 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        '.theme-transition-slow': {
          transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        '.no-theme-transition': {
          transition: 'none !important'
        }
      }
      addUtilities(newUtilities)
    }
  ],
} satisfies Config;