# Deploy Flyerx — Guia Completo

**Atualizado em:** 2026-08-07

## Arquitetura de Produção

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         VERCEL (Frontend)                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  apps/web (Next.js)                                              │   │
│  │  URL: https://flyerx.vercel.app                                  │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐│   │
│  │  │ API Routes (Server-Side)                                    ││   │
│  │  │ - /api/pix2depix/deposit                                    ││   │
│  │  │ - /api/pix2depix/withdraw                                   ││   │
│  │  │ - /api/pix2depix/deposit-status                             ││   │
│  │  │ - /api/pix2depix/withdraw-status                            ││   │
│  │  │ - /api/pix2depix/user-info                                  ││   │
│  │  │                                                              ││   │
│  │  │ Tokens NUNCA expostos ao browser                            ││   │
│  │  │ (sem NEXT_PUBLIC_ = server-only)                            ││   │
│  │  └─────────────────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                           X-Gateway-Key
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         RAILWAY (Backend)                               │
│                                                                         │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │    api (Laravel)        │  │    withdrawal-service (Python)      │  │
│  │                         │  │                                     │  │
│  │ - Auth/JWT              │  │ - Saques DePix→PIX                  │  │
│  │ - Wallet/Ledger         │◄─┤ - Worker LWK                        │  │
│  │ - Gateway único         │  │ - SOMENTE rede interna              │  │
│  │                         │  │                                     │  │
│  │ Middlewares:            │  │ Proteção:                           │  │
│  │ - ValidateGatewayKey    │  │ - INTERNAL_API_KEY                  │  │
│  │ - SecurityHeaders       │  │ - Sem URL pública                   │  │
│  │ - CORS restrito         │  │                                     │  │
│  └─────────────────────────┘  └─────────────────────────────────────┘  │
│               │                              │                          │
│               └──────────────┬───────────────┘                          │
│                              ▼                                          │
│                    ┌─────────────────┐                                  │
│                    │   PostgreSQL    │                                  │
│                    │ (rede interna)  │                                  │
│                    └─────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EULEN API (Provedor Externo)                       │
│                      https://depix.eulen.app/api                        │
│                                                                         │
│  Operações PIX↔DePix (depósitos, saques, status)                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## URLs de Produção

| Componente | Plataforma | URL |
|------------|------------|-----|
| Frontend | Vercel | https://flyerx.vercel.app |
| API Laravel | Railway | https://api-production-b0fd6.up.railway.app |
| withdrawal-service | Railway | Rede interna (sem URL pública) |
| PostgreSQL | Railway | Rede interna (sem URL pública) |

---

## Variáveis de Ambiente

### Vercel (apps/web)

```bash
# =====================================================
# CLIENT-SIDE (NEXT_PUBLIC_) — Expostas no browser
# =====================================================

# URL da API Laravel para autenticação
NEXT_PUBLIC_API_URL=https://api-production-b0fd6.up.railway.app/api

# URL da aplicação
NEXT_PUBLIC_APP_URL=https://flyerx.vercel.app

# Modo mock (sempre false em produção)
NEXT_PUBLIC_MOCK_API=false

# =====================================================
# SERVER-SIDE (sem NEXT_PUBLIC_) — Só nas API Routes
# NUNCA expor no browser!
# =====================================================

# === Eulen API ===
EULEN_API_URL=https://depix.eulen.app/api
EULEN_API_TOKEN=<token-secreto>

# === Backend Python (LWK) ===
LWK_SERVICE_URL=http://withdrawal-service.railway.internal:8000
USE_BACKEND_LWK=true

# === Chaves internas ===
INTERNAL_API_KEY=<chave-interna-compartilhada>
GATEWAY_API_KEY=<chave-gateway-para-laravel>
```

### Railway — api (Laravel)

```bash
# === Aplicação ===
APP_NAME=Flyerx
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api-production-b0fd6.up.railway.app

# === Segurança ===
APP_KEY=base64:<gerado-com-artisan-key-generate>
JWT_SECRET=<gerado-com-jwt-secret>
GATEWAY_API_KEY=<mesma-chave-do-vercel>

# === Banco de dados ===
DATABASE_URL=${{Postgres.DATABASE_URL}}

# === Cache/Session (sem Redis) ===
CACHE_STORE=file
SESSION_DRIVER=database
QUEUE_CONNECTION=sync

# === CORS ===
CORS_ALLOWED_ORIGINS=https://flyerx.vercel.app,http://localhost:3000

# === Eulen ===
EULEN_API_URL=https://depix.eulen.app/api
EULEN_API_TOKEN=<token-secreto>

# === Comunicação interna ===
INTERNAL_API_KEY=<chave-interna-compartilhada>
```

### Railway — withdrawal-service (Python)

```bash
# === Aplicação ===
APP_DEBUG=false
APP_ENV=production

# === Banco de dados ===
DATABASE_URL=${{Postgres.DATABASE_URL}}

# === LWK (Liquid Wallet Kit) ===
LWK_NETWORK=liquid  # ou liquid-testnet
LWK_ELECTRUM_URL=<url-electrum>
LWK_MNEMONIC=<mnemonic-da-carteira>

# === Eulen ===
EULEN_API_URL=https://depix.eulen.app/api
EULEN_API_TOKEN=<token-secreto>

# === Taxas de parceiro ===
PARTNER_WITHDRAW_FEE_PERCENT=2.0
PARTNER_WITHDRAW_FEE_MIN_CENTS=99

# === Segurança ===
INTERNAL_API_KEY=<chave-interna-compartilhada>
```

---

## Segurança Implementada

### 1. Gateway Key (Servidor-para-Servidor)

Toda requisição do Vercel para o Railway precisa do header `X-Gateway-Key`.

**Middleware:** `api/app/Http/Middleware/ValidateGatewayKey.php`

```php
// Paths excluídos (não precisam de Gateway Key)
private array $excludedPaths = [
    'api/health',
    'api/up',
    'api/webhooks/*',
];

// Validação
$gatewayKey = $request->header('X-Gateway-Key');
$expectedKey = config('auth.gateway_key');

if (!hash_equals($expectedKey, $gatewayKey)) {
    return response()->json(['error' => 'Unauthorized'], 401);
}
```

### 2. CORS Restrito

**Config:** `api/config/cors.php`

```php
'allowed_origins' => array_filter(array_map(
    'trim',
    explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000'))
)),
```

Apenas origens listadas em `CORS_ALLOWED_ORIGINS` podem fazer requisições.

### 3. Tokens Server-Side

Todas as variáveis sensíveis no Vercel **não** têm prefixo `NEXT_PUBLIC_`:

```typescript
// ✅ CORRETO — Só acessível nas API Routes (server-side)
const PIX2DEPIX_TOKEN = process.env.EULEN_API_TOKEN;

// ❌ ERRADO — Exposto no browser
const PIX2DEPIX_TOKEN = process.env.NEXT_PUBLIC_PIX2DEPIX_TOKEN;
```

### 4. Rede Interna Railway

O `withdrawal-service` **não tem URL pública**. Só pode ser acessado:
- Pelo Laravel via rede interna Railway
- Com `INTERNAL_API_KEY` válida

---

## Como Fazer Deploy

### Frontend (Vercel)

1. Push para branch `master`
2. Vercel detecta automaticamente e faz build
3. Root Directory: `apps/web`
4. Framework: Next.js (auto-detectado)

**Ou deploy manual:**
```bash
cd apps/web
vercel --prod
```

### Backend (Railway)

1. Push para branch `master`
2. Railway detecta automaticamente e faz build
3. Cada serviço tem seu próprio Nixpacks/Dockerfile config

**Arquivos de config:**
- `api/railway.toml` — Config do Laravel
- `services/withdrawal-service/Dockerfile.local` — Dockerfile do Python (Railway usa Nixpacks por padrão)

---

## Health Checks

### Laravel
```bash
curl https://api-production-b0fd6.up.railway.app/api/health
# {"status":"ok","timestamp":"2026-08-07T..."}
```

### Frontend
```bash
curl -s -o /dev/null -w "%{http_code}" https://flyerx.vercel.app
# 200 (ou 307 redirect para login)
```

---

## Troubleshooting

### Erro 500 no Railway

**Possível causa:** Redis não configurado

**Solução:**
```bash
CACHE_STORE=file
SESSION_DRIVER=database
QUEUE_CONNECTION=sync
```

### "Gateway key not configured"

**Causa:** Deploy ainda não terminou ou variável não configurada

**Solução:**
1. Verificar se `GATEWAY_API_KEY` está nas variáveis do Railway
2. Aguardar redeploy completar

### "Invalid gateway key"

**Causa:** Chave diferente entre Vercel e Railway

**Solução:**
1. Gerar nova chave: `openssl rand -base64 32`
2. Configurar a MESMA chave em ambos:
   - Vercel: `GATEWAY_API_KEY`
   - Railway (api): `GATEWAY_API_KEY`

### CORS Error no Browser

**Causa:** Origem não autorizada

**Solução:**
1. Adicionar URL em `CORS_ALLOWED_ORIGINS` no Railway
2. Formato: `https://dominio1.com,https://dominio2.com`

---

## Próximos Passos (Melhorias Futuras)

### Cloudflare na Frente

Para proteção adicional:
- DDoS protection
- WAF (Web Application Firewall)
- Rate Limiting global
- CDN para assets estáticos
- SSL automático com certificado Edge

**Arquitetura futura:**
```
Browser → Cloudflare → Vercel → Railway
```

### Redis (Quando Escalar)

Para produção em escala:
- Cache distribuído
- Sessions compartilhadas
- Queue jobs assíncronos
- Rate limiting por IP

**Variáveis:**
```bash
REDIS_URL=redis://...
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

### Admin Panel

Deploy do `apps/admin` seguindo mesmo processo:
1. Vercel project separado
2. Root Directory: `apps/admin`
3. Mesmas variáveis de ambiente

---

## Checklist Pré-Deploy

- [ ] Variáveis de ambiente configuradas em todas as plataformas
- [ ] `APP_DEBUG=false` em produção
- [ ] `GATEWAY_API_KEY` igual em Vercel e Railway
- [ ] `CORS_ALLOWED_ORIGINS` inclui URL de produção
- [ ] Health check retorna 200
- [ ] Testar login end-to-end
- [ ] Testar fluxo de depósito
- [ ] Testar fluxo de saque

---

## Contatos e Recursos

| Recurso | URL |
|---------|-----|
| Dashboard Vercel | https://vercel.com/dashboard |
| Dashboard Railway | https://railway.app/dashboard |
| Documentação Eulen | https://depix.eulen.app/docs |
| Repo GitHub | (privado) |

---

*Documento criado em 2026-08-07. Manter atualizado após mudanças de infraestrutura.*
