# Correção de Arquitetura — 2026-08-07

## Estado Atual (QUEBRADO)

### Diagnóstico

| Componente | Status | Problema |
|------------|--------|----------|
| Frontend (Vercel) | 🟢 Online | Página carrega |
| Backend Laravel (Railway) | 🟡 Parcial | Health OK, endpoints bloqueados |
| Autenticação | 🔴 Quebrada | Gateway Key não enviado |
| Eulen API | 🔴 Falha | Token possivelmente inválido |
| withdrawal-service | ⚪ Não testável | Rede interna |

### Arquitetura Atual (Incorreta)

```
┌─────────────┐     DIRETO (sem Gateway Key)      ┌─────────────┐
│   Browser   │ ──────────────────────────────────▶│   Laravel   │
│  (client)   │                                    │  (Railway)  │
└─────────────┘                                    └─────────────┘
                                                         │
                                                         ▼
                                                   ❌ 401 BLOCKED
                                                   "Invalid gateway key"
```

**Problema:** O `client.ts` chama o Laravel diretamente do browser. O Laravel exige `X-Gateway-Key` em todas as rotas (exceto health). Não podemos enviar o Gateway Key do browser porque exporia a chave secreta.

### Código Problemático

**apps/web/src/lib/api/client.ts:5**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
// ↑ Aponta direto para o Laravel (Railway)
// ↑ Browser chama diretamente, sem Gateway Key
```

**api/app/Http/Middleware/ValidateGatewayKey.php:35-49**
```php
$gatewayKey = $request->header('X-Gateway-Key');
$expectedKey = config('auth.gateway_key');

if (empty($gatewayKey) || !hash_equals($expectedKey, $gatewayKey)) {
    return $this->unauthorizedResponse('Invalid gateway key');
}
// ↑ Bloqueia TODAS as requisições sem Gateway Key
```

---

## Solução (Arquitetura Correta)

### Nova Arquitetura

```
┌─────────────┐                    ┌─────────────────────────────────────┐
│   Browser   │                    │           VERCEL (Next.js)          │
│  (client)   │                    │                                     │
└─────────────┘                    │  ┌─────────────────────────────┐   │
       │                           │  │      API Routes (proxy)     │   │
       │  /api/v1/auth/login       │  │                             │   │
       │ ─────────────────────────▶│  │  + X-Gateway-Key (server)   │   │
       │                           │  │  + Forward to Laravel       │   │
       │                           │  └─────────────────────────────┘   │
       │                           └─────────────────────────────────────┘
       │                                           │
       │                                           │ X-Gateway-Key: ***
       │                                           ▼
       │                           ┌─────────────────────────────────────┐
       │                           │           RAILWAY (Laravel)         │
       │                           │                                     │
       │                           │  ValidateGatewayKey ✅ PASS         │
       │                           │  Processa requisição                │
       │                           │  Retorna resposta                   │
       │                           └─────────────────────────────────────┘
       │                                           │
       │◀──────────────────────────────────────────┘
       │  Resposta JSON
```

**Vantagens:**
1. Gateway Key fica **server-side only** (seguro)
2. Browser nunca vê a chave
3. Mesma URL base para o frontend (`/api/v1/...`)
4. Fácil de manter

---

## Arquivos a Criar/Modificar

### CRIAR: API Routes Proxy

| Arquivo | Proxia para |
|---------|-------------|
| `apps/web/src/app/api/v1/auth/[...path]/route.ts` | `/v1/auth/*` |
| `apps/web/src/app/api/v1/wallet/[...path]/route.ts` | `/v1/wallet/*` |
| `apps/web/src/app/api/v1/transactions/[...path]/route.ts` | `/v1/transactions/*` |
| `apps/web/src/app/api/v1/pix-keys/[...path]/route.ts` | `/v1/pix-keys/*` |
| `apps/web/src/app/api/v1/payment-links/[...path]/route.ts` | `/v1/payment-links/*` |
| `apps/web/src/app/api/v1/users/[...path]/route.ts` | `/v1/users/*` |
| `apps/web/src/app/api/v1/kyc/[...path]/route.ts` | `/v1/kyc/*` |

**Estrutura do proxy (genérico):**
```typescript
import { NextRequest, NextResponse } from 'next/server';

const LARAVEL_URL = process.env.LARAVEL_API_URL;
const GATEWAY_KEY = process.env.GATEWAY_API_KEY;

async function proxyRequest(request: NextRequest, path: string[]) {
  const targetPath = path.join('/');
  const url = `${LARAVEL_URL}/v1/auth/${targetPath}`;

  const headers = new Headers(request.headers);
  headers.set('X-Gateway-Key', GATEWAY_KEY);

  const response = await fetch(url, {
    method: request.method,
    headers,
    body: request.method !== 'GET' ? await request.text() : undefined,
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}
// ... PUT, DELETE, PATCH
```

### MODIFICAR: client.ts

**Antes:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
```

**Depois:**
```typescript
// Em produção, usar proxy local. Em dev, usar Laravel direto se MOCK desabilitado.
const API_BASE_URL = '/api';
```

### ADICIONAR: Variáveis de Ambiente (Vercel)

```bash
# Server-side only (SEM NEXT_PUBLIC_)
LARAVEL_API_URL=https://api-production-b0fd6.up.railway.app/api
GATEWAY_API_KEY=<mesma chave do Railway>
```

---

## Ordem de Execução

1. **Criar helper de proxy** — `apps/web/src/lib/api/proxy.ts`
2. **Criar API routes** — Uma para cada grupo de endpoints
3. **Atualizar client.ts** — Apontar para `/api` local
4. **Atualizar .env.example** — Documentar novas variáveis
5. **Build local** — Verificar se compila
6. **Commit e push** — Deploy automático
7. **Configurar Vercel** — Adicionar variáveis de ambiente
8. **Testar em produção** — Login, registro, wallet

---

## Endpoints a Proxiar

### Auth (`/v1/auth/*`)
- POST `/v1/auth/register`
- POST `/v1/auth/login`
- POST `/v1/auth/logout`
- GET `/v1/auth/me`
- POST `/v1/auth/refresh`
- POST `/v1/auth/forgot-password`
- POST `/v1/auth/reset-password`
- POST `/v1/auth/verify-email`
- POST `/v1/auth/resend-verification`
- POST `/v1/auth/change-password`
- POST `/v1/auth/2fa/setup`
- POST `/v1/auth/2fa/verify`
- POST `/v1/auth/2fa/confirm`
- POST `/v1/auth/2fa/disable`
- POST `/v1/auth/2fa/backup-codes`
- GET `/v1/auth/devices`
- DELETE `/v1/auth/devices/:id`
- POST `/v1/auth/devices/revoke-all`

### Wallet (`/v1/wallet/*`)
- GET `/v1/wallet/balance`
- GET `/v1/wallet/limits`
- GET `/v1/wallet/summary`

### Transactions (`/v1/transactions/*`)
- GET `/v1/transactions`
- GET `/v1/transactions/:id`
- POST `/v1/transactions/deposit`
- POST `/v1/transactions/withdraw`

### PIX Keys (`/v1/pix-keys/*`)
- GET `/v1/pix-keys`
- POST `/v1/pix-keys`
- DELETE `/v1/pix-keys/:id`
- POST `/v1/pix-keys/:id/set-default`

### Payment Links (`/v1/payment-links/*`)
- GET `/v1/payment-links`
- POST `/v1/payment-links`
- GET `/v1/payment-links/:id`
- PATCH `/v1/payment-links/:id`
- DELETE `/v1/payment-links/:id`

### Users (`/v1/users/*`)
- GET `/v1/users/profile`
- PATCH `/v1/users/profile`

### KYC (`/v1/kyc/*`)
- GET `/v1/kyc/status`
- POST `/v1/kyc/submit`
- POST `/v1/kyc/documents`

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Latência adicional (Vercel → Railway) | Mínimo (~50ms), aceitável |
| Cold start das API routes | Vercel otimiza, raramente perceptível |
| Duplicação de código proxy | Helper genérico reutilizável |
| CORS issues | Não aplicável (mesmo domínio) |

---

## Checklist Pós-Implementação

- [ ] Build passa sem erros
- [ ] Login funciona em produção
- [ ] Registro funciona em produção
- [ ] Wallet balance carrega
- [ ] Transações aparecem no history
- [ ] Depósito PIX gera QR Code
- [ ] Saque PIX inicia corretamente

---

## Autor

Implementação: Claude Opus 4.5
Data: 2026-08-07
Sessão: Correção de arquitetura para produção
