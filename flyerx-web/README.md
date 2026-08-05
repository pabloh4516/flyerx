# Flyerx Web

Flyerx é uma fintech moderna para operações PIX e DePix (Liquid Network), com foco em UX premium e velocidade de transações.

## Stack Tecnológica

- **Framework**: Next.js 16.3 (App Router) + React 19
- **Estilização**: Tailwind CSS 4 + Design System "Nocturne"
- **Formulários**: React Hook Form + Zod
- **Estado**: Zustand + TanStack Query
- **Integração**: Pix2Depix API (Eulen)

## Design System: Nocturne

O design system Nocturne é um tema dark premium com paleta baseada em roxo/blurple:

- **Accent**: `#9184d9` (roxo principal)
- **Background**: `#0d0e15` (preto profundo)
- **Surface**: `#15161d` (cards e elevações)

### Componentes UI

- `Button`, `Input`, `Badge`, `Card`, `Logo`
- `TabBar`, `VerificationBanner`, `ProgressRing`
- `TransactionIcon`, `GlowOrb`, `Sparkline`

## Estrutura de Rotas

### App Mobile (`/dashboard`, `/deposit`, `/withdraw`, etc.)

Rotas para usuários finais com interface mobile-first.

| Rota | Descrição |
|------|-----------|
| `/login` | Autenticação |
| `/register` | Cadastro |
| `/dashboard` | Home do usuário |
| `/deposit` | Depósito via PIX (QR Code) |
| `/withdraw` | Saque para PIX |
| `/history` | Extrato de transações |
| `/receipt/[id]` | Comprovante de transação |
| `/settings` | Configurações |
| `/security` | Segurança (2FA) |

### Seller Desktop (`/seller/*`)

Dashboard para vendedores/operadores.

| Rota | Descrição |
|------|-----------|
| `/seller/dashboard` | Visão geral do vendedor |
| `/seller/receive` | Receber PIX (gerar QR) |
| `/seller/send` | Enviar PIX (saque) |

### Admin Desktop (`/admin/*`)

Painel administrativo completo.

| Rota | Descrição |
|------|-----------|
| `/admin/dashboard` | Visão geral operacional |
| `/admin/users` | Lista de usuários e KYC |
| `/admin/users/[id]` | Revisão de KYC |
| `/admin/transactions` | Todas as transações |
| `/admin/fees` | Configuração de taxas |
| `/admin/antifraud` | Alertas de fraude |
| `/admin/audit` | Logs de auditoria |

## Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Rodar em desenvolvimento
pnpm dev

# Build de produção
pnpm build

# Verificar tipos
pnpm type-check

# Lint
pnpm lint
```

## Variáveis de Ambiente

Criar `.env.local`:

```env
# API Pix2Depix (Eulen)
PIX2DEPIX_API_URL=https://api.pix2depix.com
PIX2DEPIX_API_KEY=seu_api_key

# Mock mode (desenvolvimento)
NEXT_PUBLIC_MOCK_API=true
```

## Integração Pix2Depix

O Flyerx utiliza a API Pix2Depix da Eulen para:

1. **Depósitos**: Gera QR Code PIX, converte para DePix (Liquid)
2. **Saques**: Recebe DePix, converte para PIX
3. **Polling**: Acompanha status das transações em tempo real

### Fluxo de Depósito
```
Usuário → PIX → Eulen → DePix → Carteira Flyerx
```

### Fluxo de Saque
```
Carteira Flyerx → DePix → Eulen → PIX → Usuário
```

## Tipos Principais

```typescript
// Usuário
interface User {
  id: string;
  email: string;
  name: string;
  document: string;
  kycLevel: 'NONE' | 'BASIC' | 'VERIFIED' | 'FULL';
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  depixAddress?: string;
  euid?: string;
}

// Transação
interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  amount: number;
  fee: number;
  netAmount: number;
}

// KYC
interface KYCRequest {
  id: string;
  userId: string;
  currentLevel: KYCLevel;
  requestedLevel: KYCLevel;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESUBMIT';
  identityScore: number;
  documents: KYCDocument[];
  verifications: KYCVerification[];
}
```

## Credenciais de Teste

Para desenvolvimento com mock API:

| Email | Senha | Perfil |
|-------|-------|--------|
| `henricdm@gmail.com` | `123456` | Usuário completo |
| `admin@flyerx.com` | `admin123` | Administrador |

## Licença

Proprietário - Flyerx © 2026
