# Template de Sistema de Temas (Dark/Light)

Este template fornece um sistema completo de temas dark/light com transições suaves e um sidebar para alteração de tema.

## 📁 Estrutura do Template

```
template/
├── README.md                    # Este arquivo
├── contexts/
│   └── ThemeContext.tsx        # Context para gerenciamento de temas
├── components/
│   ├── ThemeSelector.tsx       # Componente toggle de tema
│   └── SettingsMenu.tsx        # Sidebar com configurações
├── styles/
│   ├── base.css               # Variáveis CSS dos temas
│   ├── theme.css              # Transições e aplicação de temas
│   └── animations.css         # Animações para transições
├── hooks/
│   └── useTheme.ts            # Hook personalizado para temas
└── config/
    ├── tailwind.config.ts     # Configuração do Tailwind
    └── themes.ts              # Definições de temas personalizados
```

## 🎨 Temas Disponíveis

### Tema Light (Padrão)
- Background: Branco/Cinza claro
- Foreground: Texto escuro
- Primary: Azul vibrante
- Accent: Cinza suave

### Tema Dark (GitHub Dark Dimmed)
- Background: Cinza escuro
- Foreground: Texto claro
- Primary: Azul claro
- Accent: Cinza médio

## 🚀 Como Usar

### 1. Instalação Básica

Copie os arquivos do template para seu projeto:

```bash
# Copie os contextos
cp template/contexts/* src/contexts/

# Copie os componentes
cp template/components/* src/components/

# Copie os estilos
cp template/styles/* src/styles/

# Copie os hooks (opcional)
cp template/hooks/* src/hooks/

# Copie as configurações
cp template/config/tailwind.config.ts ./
cp template/config/themes.ts src/config/
```

### 2. Configuração do Provider

Envolva sua aplicação com o `ThemeProvider`:

```tsx
// main.tsx ou App.tsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      {/* Sua aplicação aqui */}
    </ThemeProvider>
  );
}
```

### 3. Importação dos Estilos

Importe os estilos na ordem correta:

```css
/* main.css ou index.css */
@import './styles/base.css';
@import './styles/theme.css';
@import './styles/animations.css';
```

### 4. Usando o Hook de Tema

```tsx
import { useTheme } from './contexts/ThemeContext';

function MeuComponente() {
  const { theme, setTheme, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Tema atual: {theme}</p>
      <button onClick={toggleTheme}>Alternar Tema</button>
    </div>
  );
}
```

### 5. Adicionando o Selector de Tema

```tsx
import ThemeSelector from './components/ThemeSelector';
import SettingsMenu from './components/SettingsMenu';

function Header() {
  return (
    <header>
      {/* Outras coisas do header */}
      
      {/* Opção 1: Apenas o toggle */}
      <ThemeSelector />
      
      {/* Opção 2: Menu completo com sidebar */}
      <SettingsMenu />
    </header>
  );
}
```

## 🎯 Componente Principal

### ThemeSelector - Slider/Toggle Button
O **slider animado** é o componente principal para alternar entre temas dark/light:

```tsx
// Slider animado (PRINCIPAL - mais popular)
<ThemeSelector variant="slider" size="md" showLabel={true} />

// Botão simples
<ThemeSelector variant="button" showLabel={true} />

// Ícone minimal
<ThemeSelector variant="minimal" size="sm" />
```

**Características do Slider:**
- ✅ **Animação suave** de deslizamento (300ms)
- ✅ **Ícones dinâmicos** (Sol/Lua) dentro do thumb
- ✅ **Gradientes visuais** para melhor UX
- ✅ **Estados hover** e focus acessíveis
- ✅ **3 tamanhos** disponíveis (sm, md, lg)
- ✅ **Labels opcionais** (DARK/LIGHT MODE)

### SettingsMenu (Opcional)
Sidebar completo de configurações para casos mais avançados:

```tsx
<SettingsMenu 
  position="right" 
  customContent={<MeuComponentePersonalizado />} 
/>
```

## 🎯 Personalização de Temas

### Criando Novos Temas

1. **Edite o arquivo `src/config/themes.ts`:**

```typescript
export const themes = {
  light: {
    name: 'Light',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      // ... outras cores
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      // ... outras cores
    }
  },
  // Novo tema personalizado
  dracula: {
    name: 'Dracula',
    colors: {
      background: '231 15% 18%',
      foreground: '60 30% 96%',
      primary: '265 89% 78%',
      // ... outras cores
    }
  }
};
```

2. **Atualize o tipo Theme:**

```typescript
// contexts/ThemeContext.tsx
type Theme = 'dark' | 'light' | 'dracula';
```

3. **Adicione as variáveis CSS em `styles/base.css`:**

```css
.dracula-theme {
  --background: 231 15% 18%;
  --foreground: 60 30% 96%;
  --primary: 265 89% 78%;
  /* ... outras variáveis */
}
```

### Temas Sugeridos para IA

Quando a IA for criar um site, ela pode escolher entre estes estilos:

#### Temas Dark:
- **Dark Dracula**: Roxo escuro com acentos roxos
- **Dark Ocean**: Azul escuro com acentos azuis
- **Dark Forest**: Verde escuro com acentos verdes
- **Dark Sunset**: Laranja escuro com acentos quentes

#### Temas Light:
- **Light Minimal**: Branco puro com acentos sutis
- **Light Warm**: Tons quentes e acolhedores
- **Light Cool**: Tons frios e profissionais
- **Light Pastel**: Cores pastel suaves

### Exemplo de Prompt para IA:

```
"Crie um site com tema dark estilo dracula (roxo escuro com acentos roxos vibrantes) 
e tema light minimal (branco puro com acentos azuis sutis)"
```

## 🔧 Configurações Avançadas

### Transições Personalizadas

Edite `styles/animations.css` para personalizar as transições:

```css
/* Transição mais rápida */
.fast-transition * {
  transition: all 0.15s ease;
}

/* Transição mais lenta */
.slow-transition * {
  transition: all 0.5s ease;
}

/* Transição com bounce */
.bounce-transition * {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Persistência de Tema

O tema é automaticamente salvo no `localStorage` e restaurado na próxima visita.

### Detecção de Preferência do Sistema

Para detectar automaticamente a preferência do sistema:

```typescript
// No ThemeContext.tsx, adicione:
useEffect(() => {
  const savedTheme = localStorage.getItem('theme') as Theme;
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    // Detecta preferência do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }
}, []);
```

## 📱 Responsividade

O sistema de temas é totalmente responsivo. O `SettingsMenu` se adapta automaticamente a diferentes tamanhos de tela.

## 🎨 Classes CSS Úteis

Use essas classes para elementos que precisam de comportamento especial:

```css
/* Elemento que não deve ter transição */
.no-transition {
  transition: none !important;
}

/* Elemento com transição personalizada */
.custom-transition {
  transition: background-color 0.5s ease, transform 0.3s ease;
}

/* Elemento que muda apenas no hover */
.hover-only-transition {
  transition: none;
}
.hover-only-transition:hover {
  transition: all 0.2s ease;
}
```

## 🐛 Troubleshooting

### Problema: Temas não estão sendo aplicados
- Verifique se o `ThemeProvider` está envolvendo sua aplicação
- Confirme se os estilos estão sendo importados na ordem correta
- Verifique se as variáveis CSS estão definidas corretamente

### Problema: Transições muito lentas/rápidas
- Ajuste os valores de `transition` em `styles/theme.css`
- Use classes personalizadas para elementos específicos

### Problema: Tema não persiste após reload
- Verifique se o `localStorage` está funcionando
- Confirme se o `useEffect` de inicialização está sendo executado

## 📄 Licença

Este template é de uso livre para projetos pessoais e comerciais.

---

**Criado para uso com IA na geração automática de sites com sistema de temas.**