# Layouts — Nocturne Design System

**Criado:** 2026-08-05
**Origem:** Migrado de `flyerx-web/DESIGN_SYSTEM.md` (arquivo deletado)
**Fonte de verdade:** Este documento + codigo real do layout.tsx

---

## WEB — Seller Dashboard (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│                         Header                               │
│   56px altura (py-3) | px-6 | bg glass surface 55%          │
├──────────────┬──────────────────────────────────────────────┤
│              │                                               │
│   Sidebar    │              Main Content                     │
│   220px      │              p-7 (28px) + gap-6               │
│   px-3 py-4  │                                               │
│              │                                               │
└──────────────┴──────────────────────────────────────────────┘
```

### Especificacoes

| Elemento | Valor px | Classe Tailwind | Notas |
|----------|----------|-----------------|-------|
| Header altura | 56px | `py-3` (+ conteudo) | Calculado: 12px + ~32px content |
| Header padding horizontal | 24px | `px-6` | |
| Header background | — | `bg-[color-mix(in_srgb,var(--color-surface)_55%,transparent)]` | Glass effect |
| Sidebar largura | 220px | `w-[220px]` | Valor fixo |
| Sidebar padding | 12px 16px | `px-3 py-4` | |
| Sidebar background | — | `bg-[color-mix(in_srgb,var(--color-surface)_35%,transparent)]` | Glass sutil |
| Main content padding | 28px | `p-7` | **UNIFORME** (nao diferenciado) |
| Main content gap entre secoes | 24px | `gap-6` | |

### Reconciliacao de divergencia

**Documento antigo (DESIGN_SYSTEM.md):** `padding: 28px 36px` (py-7 px-9)
**Codigo real (layout.tsx + dashboard/page.tsx):** `p-7` (28px uniforme)
**Decisao 01-decisoes.md regra 8.4:** `p-6 ou p-7`

**Veredito:** O valor **p-7 uniforme** e o correto. O documento antigo estava incorreto.

---

## MOBILE — App (Referencia futura)

> **Status:** Especificacao de referencia para retrofit futuro do flyerx-mobile.
> Valores extraidos dos mockups originais, NAO do codigo atual do mobile.

```
┌─────────────────────────────────┐
│         Status Bar              │ ← 74px do topo (safe area iOS)
├─────────────────────────────────┤
│                                 │
│          Conteudo               │ ← padding: 22px (p-[22px] ou p-5.5)
│                                 │
├─────────────────────────────────┤
│          Tab Bar                │ ← glass, 12px padding interno
└─────────────────────────────────┘
```

### Especificacoes Mobile (referencia)

| Elemento | Valor px | Classe Tailwind aprox. | Notas |
|----------|----------|------------------------|-------|
| Safe area top | 74px | `pt-[74px]` | iOS notch |
| Content padding | 22px | `p-[22px]` ou `p-5.5` | Valor nao-padrao |
| Tab bar padding | 12px | `p-3` | |
| Tab bar background | — | `glass` | Backdrop blur |

> **Nota:** O valor 22px nao e padrao Tailwind (5.5 = 22px). Avaliar uso de `p-5` (20px) ou `p-6` (24px) no retrofit.

---

## Breakpoints

| Nome | Largura | Uso |
|------|---------|-----|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape / Desktop pequeno |
| xl | 1280px | Desktop |
| 2xl | 1536px | Desktop grande |

---

## Historico

- **2026-08-05:** Documento criado a partir de DESIGN_SYSTEM.md; reconciliada divergencia do padding main content.
