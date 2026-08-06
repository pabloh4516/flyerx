# Flyerx Web — Regras do Frontend

@AGENTS.md

## Design System: Nocturne

- Todo estilo visual DEVE usar os tokens definidos em `globals.css` e `@theme` (cores, radius, shadows). PROIBIDO valor visual hardcoded/arbitrario (`bg-[#...]`, `p-[13px]`, `rounded-[10px]` etc.).

- Componentes de UI vem EXCLUSIVAMENTE de `components/ui/`. NUNCA criar variacoes "-custom" novas. Antes de criar qualquer componente, verificar se ja existe.

- NAO criar componentes novos (Drawer, Pagination, Progress etc.) sem solicitacao explicita do usuario — criar somente quando uma tela real precisar.

- Pagina `/design-system` e o showcase oficial. Componente novo ou alterado deve ser refletido la.

## Documentos de referencia (fonte de verdade)

- `../docs/design/00-auditoria-web.md` — auditoria completa do estado atual
- `../docs/design/01-decisoes.md` — decisoes de tokens, componentes e regras visuais
- `../docs/design/02-consolidacao.md` — registro da sessao de consolidacao
- `../docs/design/03-layouts.md` — especificacoes de layout (web e mobile)

## Estado do retrofit

- **Consolidacao CONCLUIDA** (2026-08-05).
- **Grupo A CONCLUIDO** (receive, send).
- **Grupo B CONCLUIDO** (login, register, forgot-password, verify-email).
- **Grupo C CONCLUIDO** (history, dashboard).
- **Grupo D CONCLUIDO** (pix-keys, payment-links, subaccounts, developers, settings).
- **MIGRACAO DE TELAS COMPLETA** — Fase 4 finalizada.
- **Proximo:** Fase 5 QA final.
- Biblioteca de componentes unificada, tokens corrigidos, sintaxe Tailwind 4 religada.
- Commit baseline: `c734667`

### Vereditos dos pares duplicados

| Par | Arquivo canonico | Status |
|-----|------------------|--------|
| Checkbox | `checkbox.tsx` | Consolidado |
| Switch | `switch.tsx` | Consolidado |
| Avatar | `avatar.tsx` | Consolidado |
| Skeleton | `skeleton.tsx` | Consolidado |
| Tabs | `tabs.tsx` | Consolidado |
| Alert | `alert.tsx` | Consolidado |
| Modal | `modal.tsx` | Consolidado |
| Toast | `sonner.tsx` | Consolidado |
| Select | `select.tsx` + `select-native.tsx` | Consolidado |

**Regra Select:** Padrao e `select.tsx`. Usar `select-native.tsx` apenas em contextos mobile-first com poucas opcoes (<10) onde o picker nativo do OS oferece melhor experiencia touch. Em duvida, usar `select.tsx`.

## Regras de trabalho

1. **Retrofit visual NUNCA muda funcionalidade.** Bugs ou melhorias encontrados durante trabalho visual devem ser anotados em `TODO.md`, nao corrigidos na hora.

2. **Backend (`../api` e `../flyerx-backend`) e intocavel.** Ver `CLAUDE.md` da raiz.

3. **Handoff entre sessoes por markdown** em `../docs/design/`, nunca pela memoria da conversa.

4. **Imports de componentes UI:** Sempre importar de `@/components/ui` (index centralizado), nunca de arquivos individuais.

5. **Radius:** Usar classes padrao Tailwind que mapeiam para tokens Nocturne via @theme:
   - `rounded-sm` (4px): Skeleton de texto, elementos micro
   - `rounded-md` (8px): Badge, Tag, Tabs trigger, Checkbox box
   - `rounded-lg` (14px): Input, Textarea, Select, Button, Toast, Tooltip, Dropdown
   - `rounded-xl` (20px): Card, Modal, Surface, StatCard, Alert
   - `rounded-full` (9999px): Avatar, Switch track, IconButton, Radio dot, pills
   - **PROIBIDO:** `rounded-[Npx]`, `rounded-[--radius-*]` (sintaxe invalida no Tailwind 4)

6. **Cores:** Usar cores semanticas (`text-neutral-*`, `bg-accent-*`, `border-divider`). NUNCA hex arbitrario.

7. **Spacing:** Usar escala padrao Tailwind (`gap-2`, `p-4`, `m-6`, etc.):
   - Valores comuns: 1.5 (6px), 2 (8px), 3 (12px), 3.5 (14px), 4 (16px), 5 (20px), 6 (24px)
   - **PROIBIDO:** `gap-[Npx]`, `p-[Npx]`, `var(--space-*)`, `[--space-*]`
   - Excecao: posicionamento absoluto de elementos decorativos

8. **Icones:** Lucide React (biblioteca unica):
   - Tamanhos: `size-3` (badge), `size-3.5` (checkmark), `size-4` (padrao), `size-5` (nav/modal), `size-6` (destaque)
   - strokeWidth: usar default (2), exceto checkmark (3) ou icones sutis (1.5)
   - **PROIBIDO:** `size-[Npx]` arbitrario, outras bibliotecas de icones
   - Cor: herdar do texto parent ou usar classes semanticas (`text-primary`, `text-accent-300`, `text-neutral-*`)

9. **Grid/Layout:**
   - Sidebar: `w-[220px]`, `px-3 py-4`
   - Main content: `p-6` ou `p-7`, `gap-6` entre secoes
   - Container: usar sizes (`sm`/`md`/`lg`/`xl`/`full`), padrao `lg`
   - Grid de cards: responsivo por padrao (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`); grid fixo e excecao justificada
   - Breakpoints: sm(640) md(768) lg(1024) xl(1280) 2xl(1536)
   - **PROIBIDO:** padding/margin arbitrario (`p-[23px]`), max-width arbitrario
   - Excecao: largura de sidebar, grid proporcional (`grid-cols-[1.5fr_1fr]`)

10. **Contraste (CRITICO):**
   - Texto sobre fundo accent claro: usar `text-background` (escuro), NUNCA `text-primary-foreground`
   - Tons 800/900 (accent ou neutral) NUNCA como cor de texto sobre fundo escuro
   - `text-accent` = accent-900 (escuro demais) — usar `text-accent-300` ou `text-accent-400` para texto
   - `bg-accent` = accent-900 — OK para fundos de destaque; para fundos vibrantes usar `bg-primary`
   - Controles de formulario (checkbox, radio, switch) DEVEM ter borda visivel sobre Card e Surface
   - Ver `01-decisoes.md` secao 14 para tabela completa

## Comandos

```bash
# Desenvolvimento
pnpm dev

# Build
pnpm build

# Lint
pnpm lint
```

## Estrutura de componentes

```
src/components/
├── ui/           # Design System (Nocturne)
│   ├── index.ts  # Exportacoes centralizadas
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── features/     # Componentes especificos de dominio
├── forms/        # Componentes de formulario
└── layout/       # Componentes de layout (header, sidebar)
```

## Pagina nova

Ao criar qualquer pagina nova:

1. **Copiar o esqueleto** de `../docs/design/05-templates.md` conforme o tipo:
   - **Template A** (app): paginas em `(main)/` — Container size lg, grid responsivo
   - **Template B** (auth/formulario): paginas em `(auth)/` — min-h-screen centralizado, Container size sm

2. **Montar SOMENTE** com componentes de `components/ui/`

3. **Faltou peca?** Criar na biblioteca (`components/ui/`) + adicionar ao showcase (`/design-system`) ANTES de usar na pagina

4. **Zero valor visual arbitrario** (`[Npx]`, `[--`, `[#hex]`) — excecoes documentadas em 05-templates.md

5. **Conferir contra o checklist** do template antes do commit:
   - Container correto?
   - Componentes so da biblioteca?
   - Tipografia conforme D.3?
   - Maximo 1 solid?
   - Labels externos (auth)?
   - Responsivo?
