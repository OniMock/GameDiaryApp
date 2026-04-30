# 📜 Prompt do Agente de IA para Alterações no Site

Sempre que fizer QUALQUER alteração ou adição no código do meu site **React com Vite**, siga **estritamente** estas regras:

---

## 🌎 Internacionalização (i18n)

1. **Nunca** escreva textos fixos (hardcoded) diretamente no JSX, TS ou JS.
2. **Sempre** verifique se a string já existe no sistema de i18n.
   - O sistema de i18n está na pasta `/strings` na raiz do projeto.
   - Cada idioma tem seu próprio arquivo JSON, com chaves organizadas por seções.
3. Se a string **não existir**:
   - Crie uma nova chave seguindo o padrão já utilizado no projeto.
   - Adicione a tradução **em todos os arquivos de idioma** (mesmo que provisoriamente com o texto original).
4. No código, **sempre use** a função/método de tradução (`t('chave')` ou equivalente) no lugar do texto.

---

## 🎨 Sistema de Temas (dark/light)

1. **Nunca** definir cores fixas diretamente no CSS ou inline.
2. Sempre use **as variáveis de tema já existentes** (`var(--color-name)`) para cores, fontes ou espaçamentos.
3. Antes de criar um novo estilo, **verifique** se a variável de tema correspondente já existe.
4. Caso precise criar uma nova cor/estilo:
   - Adicione-a em **todos os temas** (light e dark) nos arquivos de configuração de tema.
   - Use nomes descritivos (`--button-bg`, `--header-text-color`).
5. Qualquer componente novo deve suportar **troca de tema** sem precisar ser modificado no futuro.

---

## 🛠️ Boas Práticas e Modularidade

1. **Siga boas práticas de React**:
   - Use componentes funcionais e hooks modernos (`useState`, `useEffect`, etc.).
   - Evite duplicação de código, priorizando reutilização de componentes e funções.
   - Mantenha componentes pequenos, focados e com responsabilidades únicas (Single Responsibility Principle).
2. **Garanta modularidade**:
   - Organize o código em pastas lógicas (e.g., `/components`, `/hooks`, `/utils`).
   - Crie componentes reutilizáveis sempre que possível.
   - Evite lógica complexa em componentes; extraia para hooks ou utilitários.
3. **Use TypeScript adequadamente**:
   - Defina tipos explícitos para props, estados e retornos de funções.
   - Evite o uso de `any` a menos que estritamente necessário (com comentário justificando).
4. **Mantenha o código legível**:
   - Use nomes de variáveis e funções claros e descritivos.
   - Adicione comentários apenas quando necessário para explicar lógica complexa.

---

## 🔍 Verificação com ESLint

1. **Garanta conformidade com ESLint**:
   - Antes de finalizar qualquer alteração, verifique se o código passa nas regras do ESLint configuradas no projeto.
   - Corrija todos os erros e avisos do ESLint, a menos que haja uma justificativa explícita.
2. Se uma regra do ESLint for intencionalmente ignorada:
   - Adicione um comentário no código explicando o motivo.
   - Sugira como a violação pode ser resolvida no futuro.
3. **Nunca desative regras do ESLint globalmente** sem aprovação explícita.

---

## 🧪 Checklist antes de finalizar

- [ ] Nenhum texto hardcoded (tudo via i18n).
- [ ] Todas as strings novas adicionadas aos arquivos de idioma.
- [ ] Nenhuma cor fixa (tudo via variáveis de tema).
- [ ] Variáveis novas aplicadas nos dois temas (light/dark).
- [ ] Componente/tela testado nos dois temas para confirmar compatibilidade.
- [ ] Código segue boas práticas de React (componentes funcionais, hooks, etc.).
- [ ] Componentes são modulares, reutilizáveis e organizados.
- [ ] Tipagem do TypeScript está correta e sem uso desnecessário de `any`.
- [ ] Código passou na verificação do ESLint sem erros ou avisos (ou com justificativas documentadas).

---

⚠️ **IMPORTANTE:** Se qualquer uma dessas regras não puder ser seguida, explique no comentário do código o motivo e sugira como corrigir futuramente.
