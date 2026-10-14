# UI Review — Rol de Membros

**Data:** 12 de Outubro de 2026  
**Escopo:** Frontend React (`src/components/`, `src/App.tsx`)  
**Metodologia:** GSD 6-Pillar Visual & Interaction Audit (adversarial code-audit)

---

### Sumário de Pontuação

- **Copywriting:** 3/4
- **Visuals & Hierarchy:** 3/4
- **Color & Theming:** 3/4
- **Typography:** 2/4
- **Spacing & Layout:** 3/4
- **Experience Design:** 2/4

**Pontuação Geral:** **16/24**

---

### Diagnóstico por Pilar

#### 1. Copywriting (Nota: 3/4)
- **Pontos Positivos:** Contextualização consistente com termos da igreja e assembleia presbiteriana ("Rol de Membros", "Comungante", "Ofício", "Quórum", "Eleição").
- **Gaps (Warning):**
  - Botões com termos genéricos sem complemento de ação em telas secundárias (ex.: "Salvar" isolado em `Header.tsx`, "Cancelar" genérico).
  - Mensagens de erro com texto genérico ou alertas nativos (`alert(...)` / `confirm(...)` em `VotingStation.tsx`).

#### 2. Visuals & Hierarchy (Nota: 3/4)
- **Pontos Positivos:** Uso consistente de ícones `lucide-react`, cards bem delimitados e contraste claro entre seções ativas no Sidebar.
- **Gaps (Warning):**
  - Dos 118 botões identificados, apenas 32 possuem `aria-label` ou `title`. Botões de ação rápida com apenas ícones ficam inacessíveis para leitores de tela e confusos em visualizações mobile compactas.

#### 3. Color & Theming (Nota: 3/4)
- **Pontos Positivos:** Paleta base consistente em `slate` (neutros) e `indigo` (primário/destaque).
- **Gaps (Warning):**
  - Dispersão de variantes de cor (`indigo-50/600/700`, `emerald`, `rose`, `amber`) aplicadas diretamente inline sem variáveis CSS centralizadas para estados semânticos de perigo/sucesso.

#### 4. Typography (Nota: 2/4)
- **Pontos Críticos (Blocker/Warning):**
  - **Excesso de tamanhos e pesos:** 8 tamanhos de fonte (`text-xs` até `text-5xl`) e múltiplos pesos convivendo na mesma view (`font-normal`, `font-medium`, `font-semibold`, `font-bold`, `font-extrabold`, `font-black`).
  - Uso de tamanhos arbitrários ultrapequenos como `text-[9px]` e `text-[10px]` em `StatisticsView.tsx`, prejudicando legibilidade e contraste visual para usuários com visão reduzida.

#### 5. Spacing & Layout (Nota: 3/4)
- **Pontos Positivos:** Utilização correta da escala padrão do Tailwind (`p-2`, `p-4`, `gap-3`, `gap-6`).
- **Gaps (Warning):**
  - Ocorrências pontuais de valores arbitrários (`min-w-[40px]`, `min-h-[40px]`, `h-[400px]`, tracking arbitrário `tracking-[0.1em]`) que deveriam ser normalizados nos tokens do design system.

#### 6. Experience Design (Nota: 2/4)
- **Pontos Críticos (Blocker/Warning):**
  - **Diálogos Nativos:** Presença de `window.confirm()` e `confirm(...)` nativos do browser para ações destrutivas (ex.: declínio ou exclusão de candidatos em eleição), em vez de modal com design system da aplicação.
  - Ausência de Skeleton loaders granulares nas listas (usa spinners simples centralizados ou textos "Carregando...").

---

### Top 3 Ações Prioritárias

1. **Substituir `window.confirm()` por Modal UI nativo da aplicação** (Pilar 6 - Experience Design).
2. **Normalizar Tipografia e Acessibilidade** (Pilares 2 e 4): eliminar `text-[9px]/[10px]` e adicionar `aria-label` aos botões com ícones.
3. **Padronizar Design Tokens de Cores e Estados** (Pilares 3 e 5): consolidar as classes de alerta/status semânticos.
