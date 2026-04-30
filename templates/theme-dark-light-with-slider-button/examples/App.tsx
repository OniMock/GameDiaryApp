import React from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import ThemeSelector from '../components/ThemeSelector';
import SettingsMenu from '../components/SettingsMenu';
import '../styles/base.css';
import '../styles/theme.css';
import '../styles/animations.css';

// Exemplo de uso do template de temas
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        {/* Header com slider de tema (PRINCIPAL) */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">
              Meu Site com Temas
            </h1>
            
            {/* Slider/Toggle Button - Componente PRINCIPAL */}
            <ThemeSelector variant="slider" size="md" showLabel={true} />
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="container mx-auto px-4 py-8">
          {/* Seção principal - Slider/Toggle Button */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              🌙☀️ Slider/Toggle Button de Tema
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              O componente principal do template: um slider animado para alternar entre temas dark/light
              com transições suaves e ícones dinâmicos.
            </p>
            
            {/* Demonstração do slider em diferentes tamanhos */}
            <div className="flex flex-col items-center space-y-6 bg-card p-8 rounded-lg border border-border">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Tamanho Grande</h3>
                <ThemeSelector variant="slider" size="lg" showLabel={true} />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Tamanho Médio (Padrão)</h3>
                <ThemeSelector variant="slider" size="md" showLabel={true} />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Tamanho Pequeno</h3>
                <ThemeSelector variant="slider" size="sm" showLabel={true} />
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Outras variantes */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">
                Outras Variantes
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-2 block">
                    Botão Simples
                  </label>
                  <ThemeSelector variant="button" showLabel={true} />
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-2 block">
                    Ícone Minimal
                  </label>
                  <ThemeSelector variant="minimal" size="lg" />
                </div>
              </div>
            </div>

            {/* Demonstração de cores */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">
                Paleta de Cores
              </h2>
              <div className="space-y-2">
                <div className="h-8 bg-primary rounded flex items-center px-3 text-primary-foreground text-sm">
                  Primary
                </div>
                <div className="h-8 bg-secondary rounded flex items-center px-3 text-secondary-foreground text-sm">
                  Secondary
                </div>
                <div className="h-8 bg-accent rounded flex items-center px-3 text-accent-foreground text-sm">
                  Accent
                </div>
                <div className="h-8 bg-muted rounded flex items-center px-3 text-muted-foreground text-sm">
                  Muted
                </div>
              </div>
            </div>

            {/* Settings Menu (opcional) */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">
                Settings Menu (Opcional)
              </h2>
              <p className="text-muted-foreground mb-4 text-sm">
                Para casos mais avançados, use o sidebar completo:
              </p>
              <SettingsMenu />
            </div>
          </div>

          {/* Seção de informações */}
          <div className="mt-12 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Template de Sistema de Temas
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Foque no <strong>slider/toggle button</strong> como componente principal.
              Ele oferece a melhor experiência do usuário com animações suaves e design intuitivo.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card mt-16">
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-muted-foreground">
              Template de Sistema de Temas - Criado para uso com IA
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
};

export default App;