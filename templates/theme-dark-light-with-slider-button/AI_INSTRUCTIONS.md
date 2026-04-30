# 🤖 Instruções para IA - Sistema de Temas

Este documento contém instruções específicas para agentes de IA utilizarem este template de sistema de temas.

## 📋 Checklist de Implementação

Quando usar este template, siga esta ordem:

### 1. ✅ Configuração Inicial
- [ ] Copiar `contexts/ThemeContext.tsx` para `src/contexts/`
- [ ] Copiar `components/ThemeSelector.tsx` para `src/components/`
- [ ] Copiar `components/SettingsMenu.tsx` para `src/components/`
- [ ] Copiar `styles/` completo para `src/styles/`
- [ ] Copiar `hooks/useTheme.ts` para `src/hooks/`
- [ ] Copiar `config/themes.ts` para `src/config/`
- [ ] Atualizar `tailwind.config.ts` com a configuração do template

### 2. ✅ Integração no Projeto
- [ ] Envolver App com `<ThemeProvider>`
- [ ] Importar estilos na ordem: base.css → theme.css → animations.css
- [ ] Adicionar `ThemeSelector` (slider) no header/navbar
- [ ] Testar alternância entre temas com animação suave

### 3. ✅ Personalização (Opcional)
- [ ] Definir temas personalizados em `config/themes.ts`
- [ ] Atualizar tipo `Theme` se necessário
- [ ] Adicionar variáveis CSS para novos temas

## 🎨 Prompts Sugeridos para IA

### Para Criação de Sites
```
"Crie um site [descrição] usando o template de temas. 
Use tema dark [estilo] e tema light [estilo].
Inclua o slider/toggle button de tema no header."
```

### Exemplos de Estilos de Tema:
- **Dark**: dracula, ocean, forest, sunset, github-dark
- **Light**: minimal, warm, cool, pastel, clean

### Para Personalização
```
"Personalize os temas para um site de [nicho].
Tema dark: [cor primária] com acentos [cor secundária]
Tema light: [cor primária] com acentos [cor secundária]"
```

## 🔧 Configurações Rápidas

### Tema Simples (Apenas Dark/Light)
```typescript
// Use apenas os temas padrão
type Theme = 'dark' | 'light';
```

### Tema Múltiplo
```typescript
// Use todos os temas disponíveis
type Theme = 'light' | 'dark' | 'dracula' | 'ocean' | 'forest' | 'sunset' | 'minimal';
```

### Configuração de Transição
```css
/* Rápida (0.15s) */
.theme-transition-fast

/* Normal (0.3s) */
.theme-transition

/* Lenta (0.5s) */
.theme-transition-slow
```

## 📱 Componentes Disponíveis

### ThemeSelector (PRINCIPAL)
```tsx
// Slider animado (RECOMENDADO - mais popular)
<ThemeSelector variant="slider" size="md" showLabel={true} />

// Botão com texto
<ThemeSelector variant="button" showLabel={true} />

// Ícone minimal
<ThemeSelector variant="minimal" size="sm" />
```

**Características do Slider:**
- Animação suave de deslizamento (300ms)
- Ícones Sol/Lua dentro do thumb
- Gradientes visuais para melhor UX
- Estados hover e focus acessíveis

### SettingsMenu (Opcional)
```tsx
// Sidebar completo (para casos avançados)
<SettingsMenu position="right" />

// Com conteúdo personalizado
<SettingsMenu customContent={<MeuComponente />} />
```

## 🎯 Casos de Uso Comuns

### 1. Site Corporativo
- Tema light: minimal ou clean
- Tema dark: github-dark ou ocean
- Componente: `<ThemeSelector variant="slider" size="md" />` no header

### 2. Site Criativo
- Tema light: warm ou pastel  
- Tema dark: dracula ou sunset
- Componente: `<ThemeSelector variant="slider" size="lg" showLabel={true} />` destacado

### 3. Dashboard/Admin
- Tema light: cool ou minimal
- Tema dark: forest ou ocean
- Componente: `<ThemeSelector variant="slider" size="sm" />` na navbar + SettingsMenu opcional

### 4. E-commerce
- Tema light: clean com acentos da marca
- Tema dark: suave com acentos dourados
- Componente: `<ThemeSelector variant="slider" size="md" />` no header direito

## 🚀 Implementação Automática

### Script de Setup Rápido
```bash
# Copiar arquivos essenciais
cp template/contexts/* src/contexts/
cp template/components/* src/components/
cp template/styles/* src/styles/
cp template/hooks/* src/hooks/
```

### Imports Necessários
```tsx
// App.tsx ou main.tsx
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/base.css';
import './styles/theme.css';
import './styles/animations.css';

// Componentes
import ThemeSelector from './components/ThemeSelector';
import SettingsMenu from './components/SettingsMenu';
```

## 🎨 Paletas de Cores Sugeridas

### Temas Dark Populares
```css
/* Dracula */
--primary: 265 89% 78%; /* Roxo */
--background: 231 15% 18%; /* Cinza escuro */

/* Ocean */
--primary: 180 100% 50%; /* Azul ciano */
--background: 200 50% 10%; /* Azul escuro */

/* Forest */
--primary: 120 60% 50%; /* Verde */
--background: 120 25% 15%; /* Verde escuro */

/* Sunset */
--primary: 30 100% 60%; /* Laranja */
--background: 20 30% 15%; /* Marrom escuro */
```

### Temas Light Populares
```css
/* Minimal */
--primary: 210 100% 50%; /* Azul */
--background: 0 0% 100%; /* Branco */

/* Warm */
--primary: 25 95% 53%; /* Laranja quente */
--background: 30 40% 98%; /* Bege claro */

/* Cool */
--primary: 200 95% 53%; /* Azul frio */
--background: 210 40% 98%; /* Azul muito claro */
```

## ⚡ Performance

### Otimizações Incluídas
- Transições CSS otimizadas
- Will-change para elementos animados
- Redução de motion para acessibilidade
- Lazy loading de temas não utilizados

### Métricas Esperadas
- Tempo de troca de tema: < 300ms
- Impacto no bundle: < 5KB
- Compatibilidade: IE11+, todos os browsers modernos

## 🐛 Troubleshooting Comum

### Problema: Temas não aplicam
**Solução**: Verificar se ThemeProvider está envolvendo a aplicação

### Problema: Transições muito lentas
**Solução**: Usar classe `.theme-transition-fast`

### Problema: Conflito com outros CSS
**Solução**: Importar estilos do tema por último

### Problema: Tema não persiste
**Solução**: Verificar localStorage e useEffect no ThemeContext

## 📊 Métricas de Sucesso

- ✅ Alternância de tema funciona em < 300ms
- ✅ Todas as cores se adaptam corretamente
- ✅ Transições são suaves e consistentes
- ✅ Tema persiste após reload
- ✅ Responsivo em todos os dispositivos
- ✅ Acessível (contraste, reduced motion)

---

**Lembre-se**: Este template foi criado para ser usado por IA na geração automática de sites. Sempre teste a implementação após a criação!