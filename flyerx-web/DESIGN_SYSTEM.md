# Flyerx Design System — Nocturne

> Sistema de design escuro com accent roxo/blurple para a plataforma Flyerx.

## Índice

- [Cores](#cores)
- [Tipografia](#tipografia)
- [Espaçamento](#espaçamento)
- [Radius](#radius)
- [Sombras](#sombras)
- [Componentes](#componentes)
- [Layouts](#layouts)
- [Ícones](#ícones)

---

## Cores

### Core

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-bg` | `#161826` | Background principal |
| `--color-surface` | `#232532` | Cards, inputs, superfícies elevadas |
| `--color-text` | `#e9e9ed` | Texto principal |
| `--color-divider` | `rgba(233,233,237,0.16)` | Linhas divisórias |

### Accent (Roxo/Blurple)

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-accent` | `#9184d9` | Cor primária, links, CTAs |
| `--color-accent-2` | `#a7a1db` | Variação secundária |

### Escala Accent

```css
--color-accent-100: #f5f4ff  /* Texto claro em fundos escuros */
--color-accent-200: #e7e5fe  /* Texto em badges */
--color-accent-300: #d2cefd  /* Valores positivos, trends */
--color-accent-400: #b5abfc  /* Gráficos */
--color-accent-500: #968ae0  /* Hover states */
--color-accent-600: #796cbf  /* Ícones secundários */
--color-accent-700: #5d5294  /* Bordas de destaque */
--color-accent-800: #423a6a  /* Fundos de badges, cards accent */
--color-accent-900: #2b2741  /* Fundos escuros com tom roxo */
```

### Escala Neutral

```css
--color-neutral-100: #f3f5fe  /* Texto em badges neutras */
--color-neutral-200: #e4e7f5
--color-neutral-300: #cfd3e5  /* Texto secundário claro */
--color-neutral-400: #b2b6ca  /* Ícones, texto terciário */
--color-neutral-500: #9397ab  /* Texto muted */
--color-neutral-600: #75798c  /* Labels, placeholders */
--color-neutral-700: #595d6c  /* Bordas hover */
--color-neutral-800: #3f424d  /* Fundos de badges, cards */
--color-neutral-900: #292b31  /* Backgrounds alternativos */
```

### Glow/Section

```css
--color-section: #262a60       /* Fundo de seções destacadas */
--color-section-glow: #353b80  /* Glow orbs */
--color-section-ghost: #4c5397 /* Variação ghost */
```

### Semânticas

```css
--color-success: #34d399       /* Verde - sucesso */
--color-success-muted: #064e3b /* Fundo de badge success */
--color-warning: #fbbf24       /* Amarelo - alerta */
--color-warning-muted: #78350f /* Fundo de badge warning */
--color-error: #f87171         /* Vermelho - erro */
--color-error-muted: #7f1d1d   /* Fundo de badge error */
```

---

## Tipografia

### Fonte

- **Heading & Body**: Inter
- **Mono**: JetBrains Mono

### Escala

| Elemento | Tamanho | Peso | Line Height |
|----------|---------|------|-------------|
| h1 | 42px | 500 | 1.12 |
| h2 | 32px | 500 | 1.12 |
| h3 | 25px | 500 | 1.12 |
| h4 | 20px | 500 | 1.12 |
| h5 | 16px | 500 | 1.12 |
| h6 | 13px | 500 | 1.12 (uppercase, 0.08em spacing) |
| body | 15px | 400 | 1.55 |
| small | 13px | 400 | 1.55 |
| caption | 11px | 400 | 1.4 |
| kicker | 10px | 400 | 1.4 (uppercase, 0.1em spacing) |

### Uso

```tsx
// Headings usam font-weight 500 (medium)
<h1 className="text-[42px] font-medium tracking-tight">Título</h1>

// Valores financeiros usam tabular-nums
<span className="tabular-nums">R$ 12.847,32</span>

// Kickers (labels pequenas)
<span className="kicker">Saldo disponível</span>
```

---

## Espaçamento

Escala baseada em múltiplos de 2.8px:

| Token | Valor | Uso |
|-------|-------|-----|
| `--space-1` | 2.8px | Gaps mínimos |
| `--space-2` | 5.6px | Padding interno pequeno |
| `--space-3` | 8.4px | Padding de cards, gaps |
| `--space-4` | 11.2px | Padding médio |
| `--space-6` | 16.8px | Espaçamento entre seções |
| `--space-8` | 22.4px | Margens grandes |

---

## Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | 4px | Badges, elementos pequenos |
| `--radius-md` | 8px | Cards, inputs, buttons |
| `--radius-lg` | 14px | Modais, cards destacados |
| `--radius-xl` | 20px | Containers grandes |
| `--radius-full` | 9999px | Avatares, botões circulares |

---

## Sombras

### Dark Theme

```css
/* Sutil - bordas hairline */
--shadow-sm: 0 0 0 1px var(--color-neutral-800);

/* Média - cards elevados */
--shadow-md: 0 0 0 1px var(--color-neutral-700), 0 6px 18px rgba(0,0,0,0.55);

/* Grande - modais, popovers */
--shadow-lg: 0 0 0 1px var(--color-neutral-500), 0 16px 40px rgba(0,0,0,0.65);

/* Glow - destaque accent */
--shadow-glow: 0 0 30px color-mix(in srgb, var(--color-accent) 25%, transparent);
--shadow-glow-lg: 0 0 60px color-mix(in srgb, var(--color-accent) 35%, transparent);
```

---

## Componentes

### Button

```tsx
import { Button } from "@/components/ui/button"

// Primary - borda roxa, texto roxo (padrão)
<Button variant="primary">Continuar</Button>

// Secondary - borda neutra
<Button variant="secondary">Cancelar</Button>

// Solid - fundo roxo sólido (CTAs principais)
<Button variant="solid">Criar conta</Button>

// Ghost - sem borda
<Button variant="ghost">Ver mais</Button>

// Sizes
<Button size="sm">Pequeno</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grande</Button>

// Full width
<Button fullWidth>Botão largo</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

// Default
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>Conteúdo</CardContent>
</Card>

// Elevated - borda gradiente com sombra
<Card variant="elevated">...</Card>

// Accent - destaque com fundo section
<Card variant="accent">...</Card>

// Glass - efeito vidro com blur
<Card variant="glass">...</Card>
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="accent">Confirmado</Badge>
<Badge variant="outline">Processando</Badge>
<Badge variant="neutral">Pendente</Badge>
<Badge variant="success">Aprovado</Badge>
<Badge variant="warning">Atenção</Badge>
<Badge variant="error">Erro</Badge>
```

### Input

```tsx
import { Input } from "@/components/ui/input"

<Input placeholder="Digite seu email" />
<Input type="password" />
```

### Avatar

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

<Avatar size="default">
  <AvatarImage src="/foto.jpg" />
  <AvatarFallback>MC</AvatarFallback>
</Avatar>

// Sizes: sm, default, lg, xl
```

### Componentes Nocturne

```tsx
import {
  TransactionIcon,
  ActionCircle,
  IconButton,
  GlowOrb,
  Divider,
  Stat,
  BalanceDisplay,
  Sparkline,
  Logo,
  ProgressRing,
} from "@/components/ui/nocturne"

// Ícone de transação
<TransactionIcon type="in">
  <ArrowDown className="size-4" />
</TransactionIcon>

// Botão de ação circular
<ActionCircle variant="primary" label="Depositar">
  <ArrowDown className="size-5" />
</ActionCircle>

// Display de saldo
<BalanceDisplay value={12847.32} size="lg" />

// Sparkline
<Sparkline data={[15, 13, 14, 10, 12, 6, 8, 3]} trend="up" />

// Progress ring
<ProgressRing value={66} size={40} />

// Divider com fade
<Divider />

// Logo
<Logo size="default" />
```

---

## Layouts

### App Mobile

```
┌─────────────────────────┐
│      Status Bar         │ ← 74px do topo
├─────────────────────────┤
│                         │
│       Conteúdo          │ ← padding: 22px
│                         │
├─────────────────────────┤
│      Tab Bar            │ ← glass, 12px padding
└─────────────────────────┘
```

### Seller Dashboard (Desktop)

```
┌─────────────────────────────────────────────┐
│                 Header                       │ ← 56px altura
├──────────┬──────────────────────────────────┤
│          │                                   │
│ Sidebar  │           Main Content            │
│  220px   │         padding: 28px 36px        │
│          │                                   │
└──────────┴──────────────────────────────────┘
```

### Sidebar

- Width: 220px
- Background: `color-mix(in srgb, var(--color-surface) 35%, transparent)`
- Items: `.nav-item` e `.nav-item-active`

---

## Ícones

Usamos **Lucide React** para ícones.

```tsx
import {
  ArrowDown,     // Depositar, entrada
  ArrowUp,       // Sacar, saída
  QrCode,        // PIX QR
  Receipt,       // Extrato
  Bell,          // Notificações
  Settings,      // Configurações
  Home,          // Início
  User,          // Perfil
  Shield,        // Verificação, segurança
  Link,          // Links de pagamento
  Users,         // Subcontas
  Code,          // Desenvolvedores
  LogOut,        // Sair
} from "lucide-react"

// Tamanhos padrão
<Icon className="size-4" />  // 16px - em botões, badges
<Icon className="size-5" />  // 20px - em action circles
<Icon className="size-6" />  // 24px - destaque
```

---

## Classes Utilitárias CSS

### Glow e Efeitos

```css
.glow-accent      /* Box shadow com glow roxo */
.glow-accent-lg   /* Glow maior */
.glow-orb         /* Orb de background (section) */
.glow-orb-accent  /* Orb de background (accent) */
```

### Cards

```css
.card-elevated    /* Borda gradiente + sombra */
.card-accent      /* Fundo com gradiente section */
.glass            /* Backdrop blur + transparência */
.border-gradient  /* Borda com gradiente */
```

### Transações

```css
.tx-icon          /* Base para ícone de transação */
.tx-icon-in       /* Entrada (verde/roxo) */
.tx-icon-out      /* Saída (cinza) */
```

### Navegação

```css
.nav-item         /* Item de sidebar */
.nav-item-active  /* Item ativo */
```

### Tags

```css
.tag              /* Base */
.tag-accent       /* Roxo */
.tag-neutral      /* Cinza */
.tag-outline      /* Apenas borda */
.tag-success      /* Verde */
.tag-warning      /* Amarelo */
.tag-error        /* Vermelho */
```

### Texto

```css
.kicker           /* Label pequena uppercase */
.text-muted       /* Texto com 55% opacidade */
.tabular-nums     /* Números tabulares */
.hr-fade          /* Divider com fade nas pontas */
```

---

## Estrutura de Arquivos

```
src/
├── app/
│   ├── globals.css          # Design tokens + utilitários
│   ├── (auth)/              # Páginas de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   └── ...
│   ├── (dashboard)/         # Páginas logadas
│   │   ├── dashboard/
│   │   ├── deposit/
│   │   ├── withdraw/
│   │   └── ...
│   └── (seller)/            # Dashboard do vendedor
│       └── ...
├── components/
│   ├── ui/                  # Componentes base
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── nocturne.tsx     # Componentes específicos
│   │   └── ...
│   ├── layout/              # Componentes de layout
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── ...
│   └── features/            # Componentes de features
│       ├── balance-card.tsx
│       ├── recent-transactions.tsx
│       └── ...
└── lib/
    └── utils.ts             # cn() e utilitários
```

---

## Boas Práticas

### 1. Use as variáveis CSS

```tsx
// ✅ Bom
<div className="bg-card text-foreground" />
<div className="text-accent-300" />

// ❌ Evite
<div style={{ background: '#232532' }} />
```

### 2. Componentes com variantes

```tsx
// ✅ Use as variantes definidas
<Button variant="primary" />
<Card variant="elevated" />

// ❌ Não sobrescreva estilos inline
<Button style={{ background: 'purple' }} />
```

### 3. Espaçamento consistente

```tsx
// ✅ Use as classes de gap/padding
<div className="flex flex-col gap-4" />
<div className="p-[--space-3]" />

// ❌ Evite valores arbitrários
<div className="gap-[7px]" />
```

### 4. Responsividade

```tsx
// Mobile first
<div className="p-4 md:p-6 lg:p-8" />
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" />
```

---

## Changelog

### v1.0.0 (2026-08-04)
- Design System Nocturne inicial
- Cores, tipografia, espaçamento definidos
- Componentes base: Button, Card, Input, Badge, Avatar
- Componentes Nocturne: TransactionIcon, ActionCircle, BalanceDisplay, etc.
- Classes utilitárias CSS
