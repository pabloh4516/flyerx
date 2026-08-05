# Decisoes do Retrofit Visual — Nocturne Design System

**Data:** 2026-08-05
**Sessao:** Decisoes de tokens, componentes e regras visuais
**Status:** APROVADO — aguardando execucao nas proximas sessoes

---

## 1. TOKENS DE SPACING

### Decisao: Escala padrao Tailwind (Opcao 2)

**Justificativa:** Os tokens `--space-*` compactos (70% da escala Tailwind) NUNCA estiveram no `@theme`, portanto as paginas que usam `gap-4`/`p-4` ja renderizam a escala padrao hoje. Adotar a escala Tailwind nao causa nenhuma mudanca visual — apenas oficializa o comportamento atual. A opcao alternativa (manter escala compacta) encolheria todos os espacamentos do app em 30%, violando a regra do retrofit de nao alterar o visual alem do decidido.

### Acao na consolidacao

1. **Deletar tokens mortos** do `:root` em `globals.css` (linhas 67-72):
   ```css
   /* REMOVER */
   --space-1: 0.175rem;
   --space-2: 0.35rem;
   --space-3: 0.525rem;
   --space-4: 0.7rem;
   --space-6: 1.05rem;
   --space-8: 1.4rem;
   ```

2. **Busca global** por `[--space` e `var(--space` para garantir nenhum uso restante

---

## 2. TOKENS DE RADIUS

### Adicao ao @theme

Adicionar `--radius-full` ao bloco `@theme inline` em `globals.css`:

```css
@theme inline {
  /* ... tokens existentes ... */
  --radius-full: 9999px;
}
```

### Escala oficial Nocturne

| Token | Valor | Classe Tailwind |
|-------|-------|-----------------|
| `--radius-sm` | 4px | `rounded-sm` |
| `--radius-md` | 8px | `rounded-md` |
| `--radius-lg` | 14px | `rounded-lg` |
| `--radius-xl` | 20px | `rounded-xl` |
| `--radius-full` | 9999px | `rounded-full` |

---

## 3. CAUSA RAIZ — SINTAXE INVALIDA NO TAILWIND 4

### Problema documentado

A sintaxe `rounded-[--radius-*]` e `gap-[--space-*]` (colchetes com CSS var sem `var()`) e **INVALIDA no Tailwind 4** e falha silenciosamente — nao gera CSS. Isso explica componentes renderizando quadrados apesar de "usarem" tokens.

### Sintaxe correta

| Invalido (falha silenciosa) | Valido |
|-----------------------------|--------|
| `rounded-[--radius-lg]` | `rounded-lg` (com @theme) |
| `gap-[--space-2]` | `gap-1.5` (escala padrao) |
| `p-[--space-3]` | `p-2` (escala padrao) |

**Nota:** `var(--token)` dentro de calc() E valido: `px-[calc(var(--space-3)*1.2)]` funciona.

### Acao na consolidacao

Busca global em `src/` por:
- `rounded-[--radius` → substituir por `rounded-sm/md/lg/xl/full`
- `[--space` → substituir por classes Tailwind padrao
- `[--` (geral) → detectar outras propriedades com o mesmo problema

---

## 4. VEREDITOS DOS PARES DUPLICADOS

### Tabela de vereditos

| Par | Vencedor | Perdedor (DELETAR) | Nome canonico final |
|-----|----------|-------------------|---------------------|
| Checkbox | checkbox-custom.tsx | checkbox.tsx | `checkbox.tsx` |
| Switch | switch-custom.tsx | switch.tsx | `switch.tsx` |
| Avatar | avatar.tsx | avatar-custom.tsx | `avatar.tsx` |
| Skeleton | skeleton-custom.tsx | skeleton.tsx | `skeleton.tsx` |
| Tabs | tabs-custom.tsx | tabs.tsx | `tabs.tsx` |
| Alert | alert-custom.tsx | alert.tsx | `alert.tsx` |
| Modal/Dialog | modal.tsx | dialog.tsx | `modal.tsx` |
| Toast/Sonner | sonner.tsx | toast.tsx | `sonner.tsx` |
| Select | **Manter ambos** | — | `select.tsx` + `select-native.tsx` |

### Renomeacao canonica

**Regra:** Nenhum arquivo oficial pode se chamar "-custom". Na fase de consolidacao:

1. Deletar os arquivos perdedores ANTES da renomeacao
2. Renomear vencedores para nome canonico:
   - `checkbox-custom.tsx` → `checkbox.tsx`
   - `switch-custom.tsx` → `switch.tsx`
   - `skeleton-custom.tsx` → `skeleton.tsx`
   - `tabs-custom.tsx` → `tabs.tsx`
   - `alert-custom.tsx` → `alert.tsx`

3. Renomear componentes exportados:
   - `CheckboxCustom` → `Checkbox`
   - `RadioCustom` → `Radio`
   - `SwitchCustom` → `Switch`
   - `SkeletonCustom` → `Skeleton`
   - `SkeletonCard`, `SkeletonListItem`, `SkeletonText` → manter nomes
   - `TabsCustom` → `Tabs`
   - `TabsList`, `TabsTrigger`, `TabsContent` → manter nomes (sem Custom)
   - `AlertCustom` → `Alert`
   - `AlertBanner` → manter nome

4. Atualizar `index.ts` de `components/ui/` para exportar somente nomes canonicos

### Tabela de migracao de imports (nomes finais)

| Arquivo | Import antigo | Import novo |
|---------|---------------|-------------|
| `register/page.tsx` | `Checkbox` de checkbox.tsx | `Checkbox` de @/components/ui (mesmo nome, nova implementacao) |
| `settings/page.tsx` | `Switch` de switch.tsx (5x) | `Switch` de @/components/ui (mesmo nome, nova implementacao) |
| `balance-card.tsx` | `Skeleton` de skeleton.tsx | `Skeleton` de @/components/ui (mesmo nome, nova implementacao) |
| `recent-transactions.tsx` | `Skeleton` de skeleton.tsx | `Skeleton` de @/components/ui (mesmo nome, nova implementacao) |
| `header.tsx` (layout) | `Avatar` de avatar.tsx | Sem mudanca (avatar.tsx vence) |
| `design-system/page.tsx` | Varios *Custom | Atualizar para nomes canonicos |
| `design-system/compare/page.tsx` | — | DELETAR pagina |

---

## 5. REGRA DO SELECT VS SELECT-NATIVE

**Padrao:** `select.tsx`

**Usar `select-native.tsx` apenas** em contextos mobile-first com poucas opcoes (<10) onde o picker nativo do OS oferece melhor experiencia touch.

**Em duvida:** usar `select.tsx`.

---

## 6. PENDENCIAS OBRIGATORIAS DA CONSOLIDACAO

### 6.1 Contraste — Checkbox/Radio/Switch (pacote unico)

**Problema:** O estado checked e visualmente indistinguivel do normal (quase invisivel).

**Correcao obrigatoria:**
- **Box unchecked:** borda visivel (`border-neutral-600` ou similar)
- **Box checked:** preenchimento accent claro + borda accent
- **Checkmark:** Lucide Check, `size-3.5`, `strokeWidth={3}`
- **Radio dot:** circulo accent com glow sutil
- **Switch unchecked:** thumb com cor visivel (`bg-neutral-400`)

Aplicar ao `checkbox.tsx` (apos renomeacao), `Radio` (mesmo arquivo), `switch.tsx` (apos renomeacao).

### 6.2 Radius quebrado nos vencedores

Os seguintes componentes usam sintaxe invalida `rounded-[--radius-*]` e renderizam SEM radius:

| Componente | Problema | Correcao |
|------------|----------|----------|
| `sonner.tsx` | Usa `--radius` generico | `rounded-lg` |
| `modal.tsx` | `rounded-[--radius-xl]` | `rounded-xl` |
| `alert.tsx` (pos-renomeacao) | `rounded-[--radius-lg]` | `rounded-lg` |
| `tabs.tsx` (pos-renomeacao) | `rounded-[--radius-lg/md]` | `rounded-lg`, `rounded-md` |
| `select-native.tsx` | `rounded-[--radius-lg]` | `rounded-lg` |

### 6.3 Spacing quebrado em card.tsx

**Problema:** `gap-[--space-2]` e `p-[--space-3]` usam sintaxe invalida — esses espacamentos NAO estao sendo aplicados hoje.

**Correcao:**
- `gap-[--space-2]` → `gap-1.5`
- `p-[--space-3]` → `p-2`
- `pt-[--space-2]` → `pt-1.5`

**ATENCAO:** A conversao vai ALTERAR o visual do Card (restaurando o espacamento perdido). Isso e conserto de estilo quebrado, NAO violacao da regra de retrofit.

**Verificacao obrigatoria:** Apos converter, verificar visualmente o Card no `/design-system` e nas paginas que o usam (dashboard, receive), ajustando o valor de spacing se o resultado ficar visivelmente pior que o atual.

### 6.4 Spacing em button.tsx

**Situacao:** `px-[calc(var(--space-3)*1.2)] py-[--space-2]`

- `calc(var(...))` e valido no Tailwind 4 — esse estilo ESTA renderizando hoje (~10px)
- Conversao para `px-2.5 py-1.5` e visualmente neutra
- Fazer a conversao para consistencia, nao por necessidade

### 6.5 Revisao geral de tokens

A revisao de radius/spacing/tokens na consolidacao vale para **TODA** a biblioteca sobrevivente, nao so os componentes listados acima.

**Verificacao final:** Usar a pagina `/design-system` como checklist visual — nenhum componente deve ter:
- Cantos quadrados (falta de radius)
- Espacamento zerado ou inconsistente
- Cores hardcoded

---

## 7. TABELAS DE CONVERSAO

### 7.1 Radius arbitrario nas paginas

| Valor atual | Conversao | Nota |
|-------------|-----------|------|
| `rounded-[14px]` | `rounded-lg` | Equivalencia exata (14px) |
| `rounded-[10px]` | Caso a caso | Se input/botao/superficie interativa → `rounded-lg`; se badge/elemento compacto → `rounded-md`. Decidir usando tabela de categorias, NUNCA manter 10px |
| `rounded-[9px]`, `rounded-[11px]` | `rounded-md` (8px) | Arredondar para token mais proximo |
| Qualquer outro | Mapear para categoria | Registrar no relatorio da migracao |

### 7.2 Spacing arbitrario nas paginas

| Valor atual | Conversao | Nota |
|-------------|-----------|------|
| `gap-[14px]` | `gap-3.5` | 14px = 3.5 * 4px |
| `gap-[6px]` | `gap-1.5` | 6px = 1.5 * 4px |
| `gap-[2px]` | `gap-0.5` | 2px = 0.5 * 4px |
| `p-[13px_16px]` | `py-3 px-4` | 13px ≈ 12px, 16px = 16px |
| `top-[-180px]`, `right-[-60px]` | **MANTER** | Posicionamento de glow orbs (excecao valida) |

### 7.3 Spacing nos componentes

| Arquivo | Valor atual | Conversao |
|---------|-------------|-----------|
| `card.tsx:25` | `gap-[--space-2]` | `gap-3` (nota 1) |
| `card.tsx:27,30` | `p-[--space-3]` | `p-5` (nota 1) |
| `card.tsx:109` | `gap-[--space-2] pt-[--space-2]` | `gap-3 pt-4` (nota 1) |
| `button.tsx:92` | `px-[calc(var(--space-3)*1.2)] py-[--space-2]` | `px-2.5 py-1.5` |

**Nota 1 (atualizado 2026-08-05):** A conversao literal de tokens mortos (gap-1.5, p-2, pt-1.5) foi substituida pelos valores da regra 8.2 ("Padding de card: p-4 compact, p-5 default, p-6 spacious") apos verificacao visual 6.3 confirmar que os textos dos cards estavam espremidos. Valores finais: gap-3, p-5, pt-4.

---

## 8. REGRAS VISUAIS APROVADAS

### 8.1 RADIUS

**Regra por categoria:**

| Categoria | Componentes | Radius |
|-----------|-------------|--------|
| Inputs e controles inline | Input, Textarea, Select, SelectNative, Dropdown trigger | `rounded-lg` (14px) |
| Botoes | Button (todos os sizes) | `rounded-lg` (14px) |
| Cards e superficies elevadas | Card, Modal, Alert, StatCard, Surface | `rounded-xl` (20px) |
| Elementos de feedback | Toast (Sonner), Tooltip | `rounded-lg` (14px) |
| Elementos compactos | Badge, Tag, Tabs trigger | `rounded-md` (8px) |
| Elementos circulares | Avatar, IconButton, Radio dot | `rounded-full` |
| Checkbox/Switch | Checkbox box: `rounded-md`; Switch track: `rounded-full` | |
| Dropdown/Popover content | SelectContent, DropdownMenu, Popover | `rounded-lg` (14px) |
| Skeleton | Herda do elemento que simula | |

**PROIBIDO:** `rounded-[Npx]`, `rounded-[--radius-*]`. Usar apenas classes padrao.

### 8.2 SPACING

**Escala:** Tailwind padrao (gap-*, p-*, m-*, px-*, py-*)

**Valores comuns:**
- `gap-0.5` / `p-0.5`: 2px
- `gap-1` / `p-1`: 4px
- `gap-1.5` / `p-1.5`: 6px
- `gap-2` / `p-2`: 8px
- `gap-3` / `p-3`: 12px
- `gap-3.5` / `p-3.5`: 14px
- `gap-4` / `p-4`: 16px
- `gap-5` / `p-5`: 20px
- `gap-6` / `p-6`: 24px
- `gap-8` / `p-8`: 32px

**Guia de escolha:**

| Contexto | Spacing |
|----------|---------|
| Gap entre icone e label | `gap-1.5` ou `gap-2` |
| Padding interno de botao | `px-3 py-2` (sm), `px-4 py-2.5` (default) |
| Padding interno de input | `px-3 py-2` |
| Gap entre campos de formulario | `gap-3.5` ou `gap-4` |
| Padding de card | `p-4` (compact), `p-5` (default), `p-6` (spacious) |
| Padding de modal | `p-6` |
| Gap entre secoes | `gap-6` ou `gap-8` |

**PROIBIDO:** `gap-[Npx]`, `p-[Npx]`, `var(--space-*)`, `[--space-*]`

**Excecoes permitidas:** Posicionamento absoluto de elementos decorativos (glow orbs, backgrounds)

### 8.3 ICONES

**Biblioteca:** Lucide React (unica permitida)

**Escala de tamanhos:**

| Classe | Valor | Contexto |
|--------|-------|----------|
| `size-3` | 12px | Badges, elementos micro |
| `size-3.5` | 14px | Checkmark em checkbox/radio |
| `size-4` | 16px | **Padrao** — botoes, inputs, dropdowns, toasts |
| `size-5` | 20px | Navegacao, modais, alerts, action buttons |
| `size-6` | 24px | Headers, empty states, icones de destaque |

**strokeWidth:**
- Padrao: 2 (default Lucide)
- Checkmark em checkbox/radio: 3
- Icones decorativos/sutis: 1.5

**Conversao:** `size-[15px]` → `size-4`

**PROIBIDO:** `size-[Npx]` arbitrario, outras bibliotecas de icones

### 8.4 GRID/LAYOUT

**Estrutura da aplicacao:**
- Sidebar: `w-[220px]`, `px-3 py-4`
- Header: `px-6 py-3`
- Main content: `p-6` ou `p-7`, `gap-6` entre secoes

**Container sizes:**
- `sm`: 672px — formularios, login, modais
- `md`: 896px — paginas de conteudo simples
- `lg`: 1152px — **padrao** — dashboards, listas
- `xl`: 1280px — paginas com muito conteudo
- `full`: 100%

**Grid de cards:**
- Gap: `gap-4`
- **Responsivo por padrao:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` ou `lg:grid-cols-4`
- Grid fixo (sem breakpoints): excecao justificada apenas em contextos comprovadamente desktop-only

**Avaliacao pendente:** Grid de quick actions (`grid-cols-4 gap-3`) — se ActionCards ficarem espremidas no mobile, converter para responsivo ou flex com wrap.

**PROIBIDO:** padding/margin arbitrario (`p-[23px]`), max-width arbitrario

**Excecoes:** largura de sidebar, grid proporcional (`grid-cols-[1.5fr_1fr]`)

---

## 9. ORDEM DE MIGRACAO DAS TELAS

Baseado no Top 10 de inconsistencias da auditoria:

| # | Pagina | Prioridade | Violacoes |
|---|--------|------------|-----------|
| 1 | `(main)/receive/page.tsx` | ALTA | 12+ radius hardcoded, divs manuais |
| 2 | `(main)/send/page.tsx` | ALTA | 12+ radius hardcoded, divs manuais |
| 3 | `(auth)/login/page.tsx` | ALTA | 10+ radius, spacing, divs manuais |
| 4 | `(main)/history/page.tsx` | MEDIA | StatusBadge manual, tabela manual |
| 5 | `(auth)/register/page.tsx` | MEDIA | 6+ radius, spacing hardcoded |
| 6 | `(main)/dashboard/page.tsx` | MEDIA | 6+ radius hardcoded, cards manuais |
| 7 | `(auth)/forgot-password/page.tsx` | MEDIA | 5+ radius, spacing hardcoded |
| 8 | `(main)/pix-keys/page.tsx` | BAIXA | Cards manuais |
| 9 | `(main)/payment-links/page.tsx` | BAIXA | Cards manuais |
| 10 | `(main)/subaccounts/page.tsx` | BAIXA | Cards manuais |

---

## 10. PLANO DAS PROXIMAS SESSOES

### Sessao 1 — Consolidacao de componentes

1. Deletar arquivos perdedores (checkbox.tsx, switch.tsx, skeleton.tsx, tabs.tsx, alert.tsx, dialog.tsx, toast.tsx)
2. Renomear vencedores para nomes canonicos
3. Renomear exports dos componentes
4. Atualizar `index.ts` com exports canonicos
5. Corrigir pendencias dos vencedores:
   - Contraste de checkbox/radio/switch
   - Radius (find-replace `rounded-[--radius-*]` → `rounded-*`)
   - Spacing de card.tsx e button.tsx
6. Adicionar `--radius-full` ao @theme
7. Deletar tokens `--space-*` mortos
8. Busca global por `[--` para detectar outras propriedades quebradas
9. Corrigir Input com fundo branco/autofill (achado da auditoria visual)
10. Deletar pagina `/design-system/compare`
11. Atualizar showcase `/design-system` com componentes canonicos

### Sessoes 2 a 5 — Migracao em grupos (uma sessao NOVA por grupo)

**Grupo A (Sessao 2):** receive + send
- `(main)/receive/page.tsx`
- `(main)/send/page.tsx`

**Grupo B (Sessao 3):** Fluxo de autenticacao
- `(auth)/login/page.tsx`
- `(auth)/register/page.tsx`
- `(auth)/forgot-password/page.tsx`
- `(auth)/verify-email/page.tsx`

**Grupo C (Sessao 4):** Dashboard e historico
- `(main)/history/page.tsx`
- `(main)/dashboard/page.tsx`

**Grupo D (Sessao 5):** Paginas secundarias
- `(main)/pix-keys/page.tsx`
- `(main)/payment-links/page.tsx`
- `(main)/subaccounts/page.tsx`
- `(main)/developers/page.tsx`
- `(main)/settings/page.tsx`

**Para cada tela:**
- Substituir radius hardcoded por tokens
- Substituir spacing hardcoded por classes Tailwind
- Migrar imports para nomes canonicos
- Substituir divs manuais por componentes da biblioteca onde aplicavel
- Verificar responsividade de grids

**Cada sessao termina com verificacao visual do usuario no navegador antes de iniciar o grupo seguinte.**

### Sessao 6 — QA final

**OBRIGATORIO:** Executar em sessao NOVA e LIMPA, sem contexto das sessoes de implementacao, comparando o app contra `01-decisoes.md` e `CLAUDE.md`.

1. Revisao visual completa de todas as telas
2. Verificar `/design-system` como showcase oficial
3. Testar em diferentes breakpoints
4. Documentar bugs encontrados
5. Atualizar auditoria com status "CONCLUIDO"

---

## 11. BADGE — Variants e aliases

### Decisao: "destructive" e alias de "error"

| Variant | Cor | Uso |
|---------|-----|-----|
| `default` | Neutral | Status neutro, tags gerais |
| `secondary` | Neutral mais claro | Informacao secundaria |
| `outline` | Apenas borda | Contorno sem preenchimento |
| `success` | Verde | Confirmado, ativo, aprovado |
| `warning` | Amarelo | Pendente, atencao |
| `error` | Vermelho | **PADRAO** — Erro, rejeitado, falha |
| `destructive` | Vermelho | **ALIAS** de `error` — manter para compatibilidade |

**Regra:** Usar `error` como padrao. `destructive` existe apenas para compatibilidade com imports de shadcn/ui.

---

*Documento gerado na sessao de decisoes de 2026-08-05. Fonte de verdade para o retrofit visual do Nocturne Design System.*
