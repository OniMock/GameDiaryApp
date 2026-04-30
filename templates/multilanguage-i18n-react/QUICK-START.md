# ⚡ Guia Rápido - Sistema i18n

## 🚀 Implementação em 5 Minutos

### 1️⃣ Copie os arquivos
```bash
# Copie a pasta src/ para seu projeto
cp -r templates/i18n-system/src/ meu-projeto/src/
```

### 2️⃣ Instale dependências
```bash
npm install lucide-react flag-icons
```

### 3️⃣ Configure CSS
```css
/* Adicione ao seu index.css */
@import "flag-icons/css/flag-icons.min.css";
```

### 4️⃣ Configure Provider
```tsx
// main.tsx ou App.tsx
import { LanguageProvider } from './contexts/LanguageProvider';

function App() {
  return (
    <LanguageProvider>
      {/* Sua aplicação */}
    </LanguageProvider>
  );
}
```

### 5️⃣ Use nos componentes
```tsx
import { useLanguage } from './hooks/use-language';
import LanguageSelector from './contexts/LanguageSelector';

function Header() {
  const { t } = useLanguage();
  
  return (
    <header>
      <h1>{t('nav.home')}</h1>
      <LanguageSelector />
    </header>
  );
}
```

## ✅ Pronto!

Seu sistema de internacionalização está funcionando com:
- 🌍 5 idiomas (en, pt-br, es, fr, de)
- 🍪 Persistência via cookies
- 🎯 Detecção automática de idioma
- 🎨 Seletor visual com bandeiras

## 📚 Próximos Passos

1. **Personalize traduções**: Edite arquivos em `src/lang/`
2. **Adicione idiomas**: Crie novos arquivos e registre em `index.ts`
3. **Customize estilos**: Modifique classes CSS no `LanguageSelector.tsx`

## 🎨 Personalização Rápida

### ⚠️ IMPORTANTE: Adaptar Tema
**O seletor DEVE seguir o tema do seu site!**

Edite as classes CSS no `LanguageSelector.tsx`:

**Tema Escuro (atual):**
```tsx
className="text-gray-300 hover:text-white glass-card hover:bg-white/10"
```

**Tema Claro:**
```tsx
className="text-gray-700 hover:text-gray-900 bg-white/80 hover:bg-white/90 border border-gray-200"
```

**Tema Dinâmico:**
```tsx
const isDark = useTheme(); // ou seu hook de tema
className={`${isDark ? 'text-gray-300 glass-card' : 'text-gray-700 bg-white/80 border'}`}
```

## 🆘 Problemas?

- **Bandeiras não aparecem**: Verifique se importou o CSS das flag-icons
- **Traduções não funcionam**: Confirme se o Provider está na raiz
- **Idioma não persiste**: Verifique se cookies estão habilitados

## 📖 Documentação Completa

- `README.md` - Documentação detalhada
- `AI-INSTRUCTIONS.md` - Para implementação via IA
- `exemplo/` - Projeto real funcionando