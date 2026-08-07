# Auditoria Completa — Flyerx

**Data:** 2026-08-07
**Sessão:** Auditoria de estado real do projeto
**Contexto:** Projeto duplicado de outra pasta, verificação do estado atual

---

## 1. Resumo Executivo

O projeto está **visualmente pronto** mas **funcionalmente quebrado em produção**.

| Componente | Status | Problema Principal |
|------------|--------|-------------------|
| Backend Laravel | 🟡 Parcial | Gateway Key bloqueia todas as chamadas |
| Frontend Vercel | 🟢 Online | Não consegue comunicar com backend |
| Autenticação | 🔴 Quebrada | Frontend não envia X-Gateway-Key |
| Depósitos (Eulen) | 🔴 Falha | Token não configurado no Vercel |
| Saques (Python) | ⚪ Não testável | Rede interna, sem URL pública |
| Admin | 🟡 Desatualizado | Design antigo, só mocks |

---

## 2. URLs de Produção

| Componente | Plataforma | URL |
|------------|------------|-----|
| Frontend | Vercel | https://flyerx.vercel.app |
| API Laravel | Railway | https://api-production-b0fd6.up.railway.app |
| withdrawal-service | Railway | Rede interna (sem URL pública) |
| PostgreSQL | Railway | Rede interna |

---

## 3. Testes Realizados

### 3.1 Backend Laravel (Railway)

```bash
# Health check - OK
curl https://api-production-b0fd6.up.railway.app/api/health
# {"status":"ok","timestamp":"2026-08-07T20:10:41-03:00"}
# HTTP 200, 0.8s

# Login - BLOQUEADO
curl -X POST https://api-production-b0fd6.up.railway.app/api/v1/auth/login
# {"error":"Unauthorized","message":"Invalid gateway key"}
# HTTP 401

# Qualquer endpoint autenticado - BLOQUEADO
curl https://api-production-b0fd6.up.railway.app/api/v1/wallet/balance
# {"error":"Unauthorized","message":"Invalid gateway key"}
# HTTP 401
```

### 3.2 Frontend Vercel

```bash
# Página de login - OK
curl https://flyerx.vercel.app/login
# HTTP 200 (HTML renderiza)

# API Route pix2depix - TOKEN INVÁLIDO
curl https://flyerx.vercel.app/api/pix2depix/user-info?euid=EU123456789012345
# {"error":"invalid token"}
# HTTP 401
```

---

## 4. Problema Principal: Gateway Key

### O que é

Middleware `ValidateGatewayKey.php` exige header `X-Gateway-Key` em todas as requisições ao Laravel (exceto health e webhooks).

### Onde está

```php
// api/app/Http/Middleware/ValidateGatewayKey.php:35-49
$gatewayKey = $request->header('X-Gateway-Key');
$expectedKey = config('auth.gateway_key');

if (empty($gatewayKey) || !hash_equals($expectedKey, $gatewayKey)) {
    return $this->unauthorizedResponse('Invalid gateway key');
}
```

### Por que não funciona

O frontend (`apps/web/src/lib/api/client.ts`) **não envia** o header `X-Gateway-Key`.

Grep por `X-Gateway-Key` no frontend: **0 resultados**.

### Impacto

- Login: ❌ Não funciona
- Registro: ❌ Não funciona
- Wallet: ❌ Não funciona
- Transações: ❌ Não funciona
- **Basicamente NADA funciona**

---

## 5. Auditoria de Segurança

### 5.1 Crítico (Ação Imediata)

| # | Problema | Arquivo | Linha |
|---|----------|---------|-------|
| 1 | API Key exposta com NEXT_PUBLIC_ | `flyerx-backend.ts` | 15 |
| 2 | Token Eulen com nome errado | `.env.local` | 28 |
| 3 | Defaults inseguros em produção | `settings.py` | 26, 73 |
| 4 | APP_KEY hardcoded (local) | `api/.env` | 3 |

#### Detalhe #1: API Key Exposta

```typescript
// apps/web/src/lib/api/flyerx-backend.ts:15
const INTERNAL_API_KEY = process.env.NEXT_PUBLIC_INTERNAL_API_KEY || 'flyerx-internal-api-key-dev-2024';
```

Variável com `NEXT_PUBLIC_` é exposta no JavaScript do browser.

#### Detalhe #2: Token com Nome Errado

```bash
# apps/web/.env.local:28 (ERRADO)
NEXT_PUBLIC_PIX2DEPIX_TOKEN=eyJhbGciOiJS...

# Código espera (CORRETO)
EULEN_API_TOKEN=eyJhbGciOiJS...
```

O código foi corrigido para usar `EULEN_API_TOKEN`, mas o .env.local ainda tem o nome antigo.

#### Detalhe #3: Defaults Inseguros

```python
# services/withdrawal-service/src/config/settings.py
app_secret_key: str = Field(default="change-me-in-production")  # :26
internal_api_key: str = Field(default="flyerx-internal-dev-key-2024")  # :73
```

### 5.2 Alto

| # | Problema | Arquivo |
|---|----------|---------|
| 5 | Mock password hardcoded | `apps/admin/src/lib/api/mock-data.ts:14` |
| 6 | LWK Mnemonic em env var | `settings.py:52` |
| 7 | JWT Secrets vazios por default | `api/.env:66` |

### 5.3 OK (Verificado)

| Item | Status |
|------|--------|
| .env files no git | ✅ Não commitados |
| .env.local no git | ✅ Não commitado |
| Tokens JWT no código | ✅ Não encontrados |
| Console.log de secrets | ✅ Não encontrados |
| CORS em produção | ✅ Configurável via env |

---

## 6. Análise dos Pontos Críticos (Código Real)

### 6.1 Taxa Flyerx nos Depósitos

**Status:** 🟢 OK — Funcionando corretamente

```typescript
// stores/fees.ts:34-36
partnerPercentFee: 0.02, // 2%
partnerDepixAddress: 'lq1qqwhzwwnaqmw83gnck8wa3t474tw20e4szuvu3j74qzvpal65e4j2yv3eeveu3x3ueasv7a55sxzc4j8wnw2nc8p9nm62dcl5f',
```

Split está configurado e é enviado para a API Eulen.

### 6.2 Carteira Liquid

**Status:** 🟡 Moderado — localStorage (não backend)

```typescript
// stores/fees.ts:129
name: 'flyerx-fees-storage', // localStorage via Zustand persist
```

Risco: Se usuário limpar dados do browser, perde carteiras salvas.

### 6.3 History/Extrato

**Status:** 🟢 OK — Usa dados reais

```typescript
// history/page.tsx:29
import { useTransactions } from '@/hooks/use-queries';

// history/page.tsx:353
const { data, isLoading, isError, refetch } = useTransactions({...});
```

Chama `/v1/wallet/transactions` no Laravel (quando funcionar).

### 6.4 Tokens/Credenciais

**Status:** 🔴 Desconfigurado

- Código espera `EULEN_API_TOKEN`
- .env.local tem `NEXT_PUBLIC_PIX2DEPIX_TOKEN`
- Resultado: Chamadas à Eulen vão sem token

---

## 7. Arquivos Modificados (Não Commitados)

```
M apps/web/src/app/(auth)/register/page.tsx     # 365 linhas alteradas
M apps/web/src/app/(main)/layout.tsx            # 252 linhas alteradas
M apps/web/src/lib/api/auth.ts                  # Removeu document/documentType
M apps/web/src/lib/api/client.ts                # Cookie para middleware
M apps/web/src/lib/validations/auth.ts          # Removeu validação CPF/CNPJ
? apps/web/src/middleware.ts                    # NOVO - proteção de rotas
```

### Mudanças Identificadas

1. **Registro simplificado:** Removeu CPF/CNPJ do cadastro inicial (será pedido no KYC)
2. **Middleware de autenticação:** Novo arquivo que protege rotas via cookie
3. **Client.ts:** Agora salva token em cookie além de sessionStorage

---

## 8. Estado do Admin

```
apps/admin/
├── Design: DESATUALIZADO (não usa Nocturne)
├── Backend: 100% MOCK
├── Autenticação: Mock com password 'admin123'
└── Funcionalidade: Placeholder/básica
```

### Necessário

1. Retrofit visual (design system Nocturne)
2. Conectar com backend Laravel real
3. Remover mocks

---

## 9. Plano de Ação Recomendado

### FASE 1: Fazer Funcionar

| # | Ação | Complexidade |
|---|------|--------------|
| 1.1 | Desabilitar ValidateGatewayKey OU criar API routes proxy | Baixa/Média |
| 1.2 | Configurar EULEN_API_TOKEN no Vercel | Baixa |
| 1.3 | Testar login, registro, depósito, saque | Baixa |

### FASE 2: Segurança

| # | Ação | Complexidade |
|---|------|--------------|
| 2.1 | Remover NEXT_PUBLIC_INTERNAL_API_KEY | Média |
| 2.2 | Criar API routes para comunicação com Python | Média |
| 2.3 | Ativar validação de webhook | Baixa |
| 2.4 | Commitar ou descartar mudanças pendentes | Baixa |

### FASE 3: Admin

| # | Ação | Complexidade |
|---|------|--------------|
| 3.1 | Retrofit visual (copiar design system do web) | Média |
| 3.2 | Criar endpoints admin no Laravel | Média |
| 3.3 | Conectar admin com backend real | Média |

---

## 10. Configurações Necessárias

### Vercel (apps/web)

```bash
# CLIENT-SIDE (ok expor)
NEXT_PUBLIC_API_URL=https://api-production-b0fd6.up.railway.app/api
NEXT_PUBLIC_APP_URL=https://flyerx.vercel.app
NEXT_PUBLIC_MOCK_API=false

# SERVER-SIDE (nunca expor)
EULEN_API_URL=https://depix.eulen.app/api
EULEN_API_TOKEN=<token-jwt-da-eulen>
GATEWAY_API_KEY=<mesma-chave-do-railway>
INTERNAL_API_KEY=<chave-para-python>
```

### Railway — api (Laravel)

```bash
GATEWAY_API_KEY=<mesma-chave-do-vercel>
CORS_ALLOWED_ORIGINS=https://flyerx.vercel.app
EULEN_API_TOKEN=<token-jwt-da-eulen>
```

---

## 11. Checklist Final

### Pré-Produção

- [ ] Gateway Key resolvido (desabilitado ou proxy implementado)
- [ ] EULEN_API_TOKEN configurado no Vercel
- [ ] GATEWAY_API_KEY igual em Vercel e Railway
- [ ] CORS_ALLOWED_ORIGINS inclui flyerx.vercel.app
- [ ] Login funciona end-to-end
- [ ] Depósito gera QR Code
- [ ] Saque gera endereço Liquid

### Segurança

- [ ] NEXT_PUBLIC_INTERNAL_API_KEY removido
- [ ] Webhook validation ativada
- [ ] Mudanças locais commitadas

### Admin

- [ ] Design system Nocturne aplicado
- [ ] Endpoints admin criados no Laravel
- [ ] Integração com backend real

---

## 12. Commits Recentes

```
52f7391 feat(security): remove NEXT_PUBLIC_ de tokens sensíveis
ac834d9 debug: remove HandleCors temporariamente
ea57c47 feat(security): adiciona CORS restrito + Gateway API Key
4c23c69 fix(api): separa FK auto-referente para compatibilidade PostgreSQL
85dcba7 fix(api): usa DATABASE_URL do Railway
```

---

## 13. Conclusão

**Estado geral:** Sistema com arquitetura bem planejada, mas implementação incompleta.

**Bloqueador principal:** Gateway Key implementado no backend mas não no frontend.

**Severidade:** 🔴 SISTEMA INOPERANTE em produção.

**Próximo passo:** Resolver Gateway Key (desabilitar ou implementar proxy).

---

## 14. Correção Aplicada (Commit 3173d48)

**Status:** ✅ PROBLEMA PRINCIPAL RESOLVIDO

O outro Claude implementou a solução de proxy:

### Arquitetura Nova

```
ANTES (quebrado):
Browser → Laravel (direto) → ❌ 401 "Invalid gateway key"

DEPOIS (funcionando):
Browser → Vercel (/api/v1/*) → Laravel (com X-Gateway-Key) → ✅ OK
```

### Arquivos Criados

| Arquivo | Função |
|---------|--------|
| `lib/api/proxy.ts` | Helper que adiciona Gateway Key server-side |
| `api/v1/auth/[...path]/route.ts` | Proxy para `/v1/auth/*` |
| `api/v1/wallet/[...path]/route.ts` | Proxy para `/v1/wallet/*` |
| `api/v1/transactions/[...path]/route.ts` | Proxy para `/v1/transactions/*` |
| `api/v1/pix-keys/[...path]/route.ts` | Proxy para `/v1/pix-keys/*` |
| `api/v1/payment-links/[...path]/route.ts` | Proxy para `/v1/payment-links/*` |
| `api/v1/users/[...path]/route.ts` | Proxy para `/v1/users/*` |
| `api/v1/kyc/[...path]/route.ts` | Proxy para `/v1/kyc/*` |

### Arquivo Modificado

`lib/api/client.ts` - Agora usa `/api` (proxy local) em produção.

### O que Falta para Funcionar

Configurar no **Vercel Dashboard**:

```
LARAVEL_API_URL=https://api-production-b0fd6.up.railway.app/api
GATEWAY_API_KEY=<mesma chave do Railway>
```

---

## 15. Estado Atual Pós-Correção

| Item | Status | Ação |
|------|--------|------|
| Gateway Key | ✅ Resolvido | Proxy implementado |
| Variáveis Vercel | ⏳ Pendente | Configurar no dashboard |
| Token Eulen | ⏳ Pendente | Configurar EULEN_API_TOKEN |
| NEXT_PUBLIC_INTERNAL_API_KEY | ⚠️ Ainda existe | Remover em fase futura |
| Admin | ⏳ Pendente | Retrofit visual + integração |

---

*Documento gerado em 2026-08-07. Atualizado após commit 3173d48.*
