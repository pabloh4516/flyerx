# Sessao de Consolidacao — Nocturne Design System

**Data:** 2026-08-05
**Sessao:** Primeira sessao que ALTERA codigo
**Fonte de verdade:** `01-decisoes.md`
**Build status:** PASSOU

---

## ETAPA 1 — Tokens (globals.css)

### 1.1 --radius-full adicionado ao @theme

Linha 215 do globals.css:
```css
--radius-full: var(--radius-full);
```

Ja existia no :root (linha 71), faltava no @theme inline.

### 1.2 Tokens --space-* deletados

Removidos do :root (eram linhas 66-72 antes da limpeza):
- `--space-1: 0.175rem` (2.8px)
- `--space-2: 0.35rem` (5.6px)
- `--space-3: 0.525rem` (8.4px)
- `--space-4: 0.7rem` (11.2px)

Nao eram usados em lugar nenhum apos conversao para classes Tailwind padrao.

### 1.3 Censo de ocorrencias `[--`

Total encontrado: **139 ocorrencias** em src/

| Categoria | Qtd | Status |
|-----------|-----|--------|
| components/ui/ (escopo desta sessao) | ~35 | Corrigido na Etapa 3 |
| Paginas (auth, main, etc.) | ~94 | Sessoes futuras |
| Spacing (`[--space-*]`) | 5 | Corrigido na Etapa 3 |
| Cores badge (`[--color-*]`) | 5 | Corrigido na Etapa 3 |

---

## ETAPA 2 — Unificacao dos pares duplicados

### 2.1 Arquivos deletados (7 "perdedores")

| Arquivo deletado | Motivo |
|------------------|--------|
| checkbox.tsx (antigo Base UI) | Substituido por checkbox-custom.tsx |
| switch.tsx (antigo Base UI) | Substituido por switch-custom.tsx |
| skeleton.tsx (antigo) | Substituido por skeleton-custom.tsx |
| tabs.tsx (antigo Base UI) | Substituido por tabs-custom.tsx |
| alert.tsx (antigo) | Substituido por alert-custom.tsx |
| dialog.tsx | Substituido por modal.tsx |
| toast.tsx | Substituido por sonner.tsx |

### 2.2 Arquivos renomeados (5 "vencedores")

| De | Para |
|----|------|
| checkbox-custom.tsx | checkbox.tsx |
| switch-custom.tsx | switch.tsx |
| skeleton-custom.tsx | skeleton.tsx |
| tabs-custom.tsx | tabs.tsx |
| alert-custom.tsx | alert.tsx |

### 2.3 Exports renomeados

| Export antigo | Export novo |
|---------------|-------------|
| CheckboxCustom | Checkbox |
| RadioCustom | Radio |
| SwitchCustom | Switch |
| SkeletonCustom | Skeleton |
| SkeletonCardCustom | SkeletonCard |
| SkeletonListItemCustom | SkeletonListItem |
| SkeletonTextCustom | SkeletonText |
| TabsCustom | Tabs |
| TabsListCustom | TabsList |
| TabsTriggerCustom | TabsTrigger |
| TabsContentCustom | TabsContent |
| AlertCustom | Alert |
| AlertBannerCustom | AlertBanner |

### 2.4 index.ts atualizado

Exports canonicos:
```typescript
export { Checkbox, Radio } from "./checkbox"
export { Switch } from "./switch"
export { Alert, AlertBanner } from "./alert"
export { Skeleton, SkeletonCard, SkeletonListItem, SkeletonText } from "./skeleton"
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"
```

### 2.5 Imports migrados nos arquivos de escopo

| Arquivo | Mudanca |
|---------|---------|
| src/app/(auth)/register/page.tsx | CheckboxCustom -> Checkbox |
| src/app/(main)/settings/page.tsx | SwitchCustom -> Switch, TabsCustom -> Tabs, etc. |
| src/components/features/balance-card.tsx | SkeletonCustom -> Skeleton |
| src/components/features/recent-transactions.tsx | SkeletonCustom -> Skeleton |
| src/app/design-system/page.tsx | Todos os imports atualizados |

### 2.6 /design-system/compare deletada

Diretorio `src/app/design-system/compare/` removido — referenciava componentes deletados e causava erro de build.

### 2.7 Checkbox label convertido para ReactNode

Props alteradas em checkbox.tsx:
```typescript
// Antes
label?: string
description?: string

// Depois
label?: React.ReactNode
description?: React.ReactNode
```

Motivo: register/page.tsx usa label com Links internos para Termos de Uso e Politica de Privacidade. A conversao para string era uma REGRESSAO FUNCIONAL.

---

## ETAPA 3 — Correcoes de sintaxe invalida

### 3.1 Conversoes rounded-[--radius-*] -> rounded-*

Sintaxe `rounded-[--radius-*]` e INVALIDA no Tailwind 4 (falha silenciosa).

| Arquivo | Conversao |
|---------|-----------|
| alert.tsx | rounded-[--radius-lg] -> rounded-lg |
| button.tsx | rounded-[--radius-lg] -> rounded-lg |
| card.tsx | rounded-[--radius-xl] -> rounded-xl |
| checkbox.tsx | rounded-[--radius-md] -> rounded-md |
| dropdown-menu.tsx | rounded-[--radius-lg] -> rounded-lg |
| icon-box.tsx | rounded-[--radius-md] -> rounded-md |
| input.tsx | rounded-[--radius-lg] -> rounded-lg |
| modal.tsx | rounded-[--radius-xl] -> rounded-xl |
| nocturne.tsx | multiplas conversoes |
| select.tsx | rounded-[--radius-lg] -> rounded-lg |
| select-native.tsx | rounded-[--radius-lg] -> rounded-lg |
| skeleton.tsx | rounded-[--radius-*] -> rounded-* |
| stat-card.tsx | rounded-[--radius-xl] -> rounded-xl |
| surface.tsx | rounded-[--radius-xl] -> rounded-xl |
| tabs.tsx | rounded-[--radius-md/lg] -> rounded-md/lg |
| textarea.tsx | rounded-[--radius-lg] -> rounded-lg |

### 3.2 Spacing corrigido conforme tabela 7.3

**card.tsx:**
```typescript
// Corrigido para:
"flex flex-col gap-1.5 rounded-xl text-card-foreground"
variant === "default" && "bg-card p-2"
// CardFooter:
"flex items-center gap-1.5 pt-1.5"
```

**button.tsx:**
```typescript
size: {
  default: "h-9 px-2.5 py-1.5",  // Corrigido de px-3.5 py-2
  // ...
}
```

### 3.3 Sonner com rounded-lg

```typescript
toastOptions={{
  classNames: {
    toast: "rounded-lg",
  },
}}
```

### 3.4 Badge com cores semanticas no @theme

**globals.css** (linhas 205-211):
```css
/* Semantic colors — bg-success, text-error, etc. */
--color-success: var(--color-success);
--color-success-muted: var(--color-success-muted);
--color-warning: var(--color-warning);
--color-warning-muted: var(--color-warning-muted);
--color-error: var(--color-error);
--color-error-muted: var(--color-error-muted);
```

**badge.tsx** (classes limpas):
```typescript
success: "bg-success-muted text-success",
warning: "bg-warning-muted text-warning",
error: "bg-error-muted text-error",
destructive: "bg-error-muted text-error",
```

---

## ETAPA 4 — Correcoes visuais

### 4.1 Contraste checkbox/radio/switch

**Status:** JA CORRETO

- checkbox.tsx linha 53: `<Check className="size-3.5" strokeWidth={3} />`
- Radio usa dot circular (nao checkmark) - correto
- Switch usa thumb deslizante - correto (`bg-neutral-400` unchecked, `bg-white` checked)

### 4.2 Input branco/autofill

**Diagnostico:**
- input.tsx e textarea.tsx usam a mesma classe `input-elevated`
- O problema NAO era o componente - era o **autofill do Chrome** que sobrescreve estilos com fundo branco/amarelo

**Fix aplicado em globals.css** (linhas 291-308):
```css
/* Autofill fix — Chrome/Safari override tema escuro */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
textarea:-webkit-autofill:active,
select:-webkit-autofill,
select:-webkit-autofill:hover,
select:-webkit-autofill:focus,
select:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px var(--color-surface) inset !important;
  -webkit-text-fill-color: var(--color-text) !important;
  caret-color: var(--color-accent) !important;
  transition: background-color 5000s ease-in-out 0s;
}
```

### 4.3 Revisao geral de radius

**Correcoes aplicadas conforme tabela 7.3:**

| Arquivo | Antes | Depois | Categoria |
|---------|-------|--------|-----------|
| alert.tsx:66 | `rounded-lg` | `rounded-xl` | Card/Surface elevada |
| tooltip-custom.tsx:79 | `rounded-md` | `rounded-lg` | Elemento de feedback |

**Verificados e corretos:**
- Input, Textarea, Select, SelectNative: `rounded-lg` ✅
- Button: `rounded-lg` ✅
- Card, Modal, StatCard, Surface: `rounded-xl` ✅
- Sonner/Toast: `rounded-lg` ✅
- Badge, Tabs trigger: `rounded-md` ✅
- Avatar, Switch track, Radio: `rounded-full` ✅
- Checkbox box: `rounded-md` ✅
- Dropdown content: `rounded-lg` ✅

---

## PROXIMOS PASSOS

### ETAPA 5 — Limpeza e showcase

1. **design-system.md da raiz**
   - Processar arquivo DESIGN_SYSTEM.md na raiz do projeto
   - Mover/consolidar conforme necessario

2. **Showcase /design-system**
   - Atualizar pagina com todos os componentes consolidados
   - Remover referencias a componentes deletados

### ETAPA 6 — Relatorio e persistencia

1. **Atualizar CLAUDE.md**
   - Refletir estado pos-consolidacao
   - Atualizar tabela de vereditos

2. **Relatorio final**
   - Resumo de todas as mudancas
   - Build status
   - Pendencias para proximas sessoes

---

## ARQUIVOS MODIFICADOS NESTA SESSAO

### components/ui/
- alert.tsx (renomeado de alert-custom.tsx, syntax fix)
- badge.tsx (cores semanticas)
- button.tsx (spacing 7.3, syntax fix)
- card.tsx (spacing 7.3, syntax fix)
- checkbox.tsx (renomeado, ReactNode props, syntax fix)
- dropdown-menu.tsx (syntax fix)
- icon-box.tsx (syntax fix)
- index.ts (exports canonicos)
- input.tsx (syntax fix)
- modal.tsx (syntax fix)
- nocturne.tsx (syntax fix)
- select.tsx (syntax fix)
- select-native.tsx (syntax fix)
- skeleton.tsx (renomeado de skeleton-custom.tsx, syntax fix)
- sonner.tsx (rounded-lg)
- stat-card.tsx (syntax fix)
- surface.tsx (syntax fix)
- switch.tsx (renomeado de switch-custom.tsx, syntax fix)
- tabs.tsx (renomeado de tabs-custom.tsx, syntax fix)
- textarea.tsx (syntax fix)

### Outros
- src/app/globals.css (--radius-full, cores semanticas, --space-* removidos)
- src/app/(auth)/register/page.tsx (imports)
- src/app/(main)/settings/page.tsx (imports)
- src/components/features/balance-card.tsx (imports)
- src/components/features/recent-transactions.tsx (imports)
- src/app/design-system/page.tsx (imports, showcase)

### Deletados
- checkbox.tsx (antigo)
- switch.tsx (antigo)
- skeleton.tsx (antigo)
- tabs.tsx (antigo)
- alert.tsx (antigo)
- dialog.tsx
- toast.tsx
- src/app/design-system/compare/ (diretorio inteiro)
