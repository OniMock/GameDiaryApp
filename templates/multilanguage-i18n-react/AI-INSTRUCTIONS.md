# 🤖 Instruções para IA - Sistema de Internacionalização

## 📋 Prompt Completo para Implementação

Use este prompt quando quiser que uma IA implemente este sistema de internacionalização:

---

**IMPLEMENTAR SISTEMA DE INTERNACIONALIZAÇÃO COMPLETO**

Implemente um sistema completo de internacionalização (i18n) em React/TypeScript seguindo exatamente esta estrutura:

### 1. ESTRUTURA DE ARQUIVOS OBRIGATÓRIA:
```
src/
├── contexts/
│   ├── LanguageContext.ts
│   ├── LanguageProvider.tsx
│   └── LanguageSelector.tsx
├── hooks/
│   └── use-language.ts
├── types/
│   └── language.ts
├── utils/
│   └── cookies.ts
└── lang/
    ├── index.ts
    ├── en.ts
    ├── ptBr.ts
    └── [outros idiomas conforme necessário]
```

### 2. DEPENDÊNCIAS OBRIGATÓRIAS:
```bash
npm install lucide-react flag-icons
```

### 3. CSS OBRIGATÓRIO:
Adicione ao arquivo CSS principal:
```css
@import "flag-icons/css/flag-icons.min.css";
```

### 4. CONFIGURAÇÃO DO PROVIDER:
Configure na raiz da aplicação (main.tsx ou App.tsx):
```tsx
import { LanguageProvider } from './contexts/LanguageProvider';

function App() {
  return (
    <LanguageProvider>
      {/* Aplicação aqui */}
    </LanguageProvider>
  );
}
```

### 5. CARACTERÍSTICAS OBRIGATÓRIAS:
- ✅ Detecção automática do idioma do navegador
- ✅ Persistência via cookies (1 ano de validade)
- ✅ Seletor visual com bandeiras dos países
- ✅ Suporte a variáveis nas traduções: `{variavel}`
- ✅ Fallback inteligente para idiomas não encontrados
- ✅ TypeScript com tipagem completa
- ✅ Interface responsiva e acessível
- ✅ ⚠️ TEMA CONSISTENTE: O seletor DEVE seguir o tema do site (escuro/claro/múltiplos)

### 6. IDIOMAS MÍNIMOS:
Implemente pelo menos:
- 🇺🇸 English (en)
- 🇧🇷 Português Brasil (pt-br)
- 🇪🇸 Español (es)

### 7. EXEMPLO DE USO:
```tsx
import { useLanguage } from './hooks/use-language';
import LanguageSelector from './contexts/LanguageSelector';

function MeuComponente() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('user.greeting', { name: 'João' })}</p>
      <LanguageSelector />
    </div>
  );
}
```

### 8. ESTRUTURA DAS TRADUÇÕES:
```typescript
// Exemplo de arquivo de idioma
const en: LanguageFile = {
  config: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: 'us', // Código da bandeira
  },
  translations: {
    'nav.home': 'Home',
    'welcome.title': 'Welcome',
    'user.greeting': 'Hello {name}!',
    // Adicione suas traduções específicas aqui
  },
};
```

### 9. REGRAS IMPORTANTES:
- Use EXATAMENTE a estrutura de arquivos fornecida
- Mantenha os nomes dos arquivos e funções
- Configure detecção automática de idioma
- Implemente persistência via cookies
- Use flag-icons para as bandeiras
- Suporte a variáveis com sintaxe `{variavel}`
- Trate fallbacks adequadamente

### 10. ADAPTAÇÃO PARA O PROJETO:
- Adapte apenas as CHAVES de tradução para o contexto específico
- Mantenha toda a estrutura e lógica do sistema
- Adicione idiomas conforme necessário
- Customize apenas os estilos CSS se necessário

**IMPORTANTE**: Siga EXATAMENTE esta estrutura. Não invente novos padrões ou arquiteturas. Este sistema já foi testado e funciona perfeitamente.

---

## 🎯 Checklist de Implementação

Quando implementar, verifique se:

- [ ] Todos os arquivos foram criados na estrutura correta
- [ ] Dependências instaladas: `lucide-react` e `flag-icons`
- [ ] CSS das bandeiras importado
- [ ] LanguageProvider configurado na raiz
- [ ] Pelo menos 3 idiomas implementados
- [ ] Detecção automática funcionando
- [ ] Cookies salvando preferência
- [ ] Seletor visual funcionando
- [ ] Variáveis nas traduções funcionando
- [ ] TypeScript sem erros

## 🔧 Customizações Permitidas

### ✅ PODE CUSTOMIZAR:
- **⚠️ TEMA OBRIGATÓRIO**: Adapte as cores para combinar EXATAMENTE com o tema do site
  - Tema escuro: Use cores escuras e efeitos glass
  - Tema claro: Use cores claras e bordas sutis
  - Múltiplos temas: Implemente lógica condicional de tema
- Chaves de tradução (adapte para seu projeto)
- Conteúdo das traduções
- Estilos CSS do seletor
- Idiomas adicionais
- Cores e animações

### 🎨 Exemplos de Adaptação de Tema:

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
const isDark = theme === 'dark';
className={`${isDark ? 'text-gray-300 glass-card' : 'text-gray-700 bg-white/80 border'}`}
```

### ❌ NÃO ALTERE:
- Estrutura de arquivos
- Nomes das funções principais
- Lógica de detecção de idioma
- Sistema de cookies
- Interface dos tipos TypeScript
- Arquitetura do Context/Provider

## 🚨 Problemas Comuns e Soluções

### Bandeiras não aparecem:
```bash
# Verifique se instalou:
npm install flag-icons

# E se importou no CSS:
@import "flag-icons/css/flag-icons.min.css";
```

### Idioma não persiste:
- Verifique se cookies estão habilitados
- Confirme se o LanguageProvider está na raiz

### Traduções não funcionam:
- Verifique se as chaves existem nos arquivos de idioma
- Confirme se o hook está sendo usado dentro do Provider

## 📚 Recursos Adicionais

- **Exemplo completo**: Veja a pasta `exemplo/` 
- **Dependências**: Veja `package-dependencies.json`
- **Estilos**: Veja `styles.css`
- **Configuração Tailwind**: Veja `tailwind-config-example.ts`

Este sistema foi desenvolvido e testado em produção. Siga exatamente as instruções para garantir funcionamento perfeito.