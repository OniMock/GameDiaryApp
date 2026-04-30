# Exemplo Real - Sistema de Internacionalização

Este é um exemplo real de como o sistema de internacionalização está sendo usado no projeto **oni-mock-portfolio-glow**.

## 📁 Estrutura do Projeto

```
exemplo/
├── src/
│   ├── contexts/          # Sistema i18n
│   │   ├── LanguageContext.ts
│   │   ├── LanguageProvider.tsx
│   │   └── LanguageSelector.tsx
│   ├── hooks/
│   │   └── use-language.ts
│   ├── types/
│   │   └── language.ts
│   ├── utils/
│   │   └── cookies.ts
│   ├── lang/              # 12 idiomas configurados
│   │   ├── index.ts
│   │   ├── en.ts
│   │   ├── ptBr.ts
│   │   ├── es.ts
│   │   ├── fr.ts
│   │   ├── de.ts
│   │   ├── ar.ts
│   │   ├── hi.ts
│   │   ├── it.ts
│   │   ├── ja.ts
│   │   ├── ko.ts
│   │   ├── ru.ts
│   │   └── zh.ts
│   └── components/        # Componentes do site
├── package.json
└── tailwind.config.ts
```

## 🌟 Características Implementadas

### 1. **Detecção Automática de Idioma**
- Detecta o idioma do navegador automaticamente
- Fallback inteligente para idiomas não suportados
- Prioridade: Cookie → Navegador → Padrão

### 2. **Persistência via Cookies**
- Salva a preferência do usuário
- Cookie com validade de 1 ano
- Funciona entre sessões

### 3. **Seletor Visual Avançado**
- Dropdown com bandeiras dos países
- Mostra nome nativo e em inglês
- Animações suaves
- Responsivo e acessível

### 4. **Suporte a Variáveis**
```typescript
// Exemplo de uso com variáveis
t('footer.text', { year: 2024 })
// Resultado: "© 2024 OniMock. Desenvolvido com ❤️ e muito café."
```

### 5. **12 Idiomas Suportados**
- 🇺🇸 English
- 🇧🇷 Português (Brasil)
- 🇨🇳 中文 (Chinês)
- 🇪🇸 Español
- 🇮🇳 हिन्दी (Hindi)
- 🇸🇦 العربية (Árabe)
- 🇫🇷 Français
- 🇷🇺 Русский
- 🇩🇪 Deutsch
- 🇮🇹 Italiano
- 🇯🇵 日本語
- 🇰🇷 한국어

## 💡 Como Usar no Seu Projeto

### 1. Copie os arquivos essenciais:
```bash
# Copie estas pastas para seu projeto:
src/contexts/
src/hooks/use-language.ts
src/types/language.ts
src/utils/cookies.ts
src/lang/
```

### 2. Instale as dependências:
```bash
npm install lucide-react flag-icons
```

### 3. Configure o CSS:
```css
/* Adicione ao seu index.css ou App.css */
@import "flag-icons/css/flag-icons.min.css";
```

### 4. Configure o Provider:
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

### 5. Use nos componentes:
```tsx
import { useLanguage } from './hooks/use-language';
import LanguageSelector from './contexts/LanguageSelector';

function MeuComponente() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('nav.home')}</h1>
      <LanguageSelector />
    </div>
  );
}
```

## 🎨 Customização

### Alterar idioma padrão:
```typescript
// src/contexts/LanguageProvider.tsx
const DEFAULT_LANGUAGE = 'pt-br'; // Mude aqui
```

### Adicionar novo idioma:
1. Crie arquivo em `src/lang/novoIdioma.ts`
2. Registre em `src/lang/index.ts`
3. Use o código correto da bandeira (flag-icons)

### Customizar estilos:
O seletor usa Tailwind CSS. Modifique as classes em `LanguageSelector.tsx`.

## 🔍 Arquivos Importantes

- **`LanguageProvider.tsx`**: Lógica principal do sistema
- **`LanguageSelector.tsx`**: Componente visual do seletor
- **`use-language.ts`**: Hook para usar em componentes
- **`lang/index.ts`**: Registro de todos os idiomas
- **`cookies.ts`**: Utilitários para persistência

## 🚀 Executar o Exemplo

```bash
cd exemplo/
npm install
npm run dev
```

Este exemplo mostra um portfólio completo com sistema de internacionalização funcionando perfeitamente!