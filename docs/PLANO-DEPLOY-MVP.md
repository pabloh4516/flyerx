# Plano de Deploy MVP — Flyerx

**Data:** 2026-08-07
**Objetivo:** Subir MVP em produção com arquitetura segura

---

## Arquitetura Final

```
                         CLOUDFLARE
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐        ┌──────────┐        ┌─────────┐
    │  Pages  │        │  Worker  │        │   WAF   │
    │ (front) │        │ (proxy)  │        │  DDoS   │
    │apps/web │        │          │        │  Bot    │
    └─────────┘        └────┬─────┘        └─────────┘
                            │
                            │ IP oculto
                            ▼
                    ┌───────────────┐
                    │    RAILWAY    │
                    │   (privado)   │
                    │               │
                    │ ┌───────────┐ │
                    │ │  Laravel  │ │
                    │ │   (api)   │ │
                    │ └─────┬─────┘ │
                    │       │       │
                    │ ┌─────▼─────┐ │
                    │ │  Python   │ │
                    │ │(withdraw) │ │
                    │ └───────────┘ │
                    │               │
                    │ ┌───────────┐ │
                    │ │ PostgreSQL│ │
                    │ └───────────┘ │
                    └───────────────┘
```

---

## Checklist de Execução

### Fase 1: GitHub (15 min)
- [ ] 1.1 Criar repositório privado no GitHub
- [ ] 1.2 Commit da reorganização
- [ ] 1.3 Push para origin

### Fase 2: Railway - Backend (30 min)
- [ ] 2.1 Criar projeto no Railway
- [ ] 2.2 Adicionar PostgreSQL
- [ ] 2.3 Deploy do Laravel (api/)
- [ ] 2.4 Configurar variáveis de ambiente do Laravel
- [ ] 2.5 Deploy do Python (services/withdrawal-service/)
- [ ] 2.6 Configurar variáveis de ambiente do Python
- [ ] 2.7 Conectar Laravel → Python (rede interna)
- [ ] 2.8 Testar health checks

### Fase 3: Cloudflare - Setup (20 min)
- [ ] 3.1 Criar conta Cloudflare (se não tiver)
- [ ] 3.2 Adicionar domínio (flyerx.com ou similar)
- [ ] 3.3 Configurar DNS
- [ ] 3.4 Ativar SSL/TLS (Full Strict)
- [ ] 3.5 Ativar DDoS protection

### Fase 4: Cloudflare Worker - Proxy (30 min)
- [ ] 4.1 Criar Worker (api-proxy)
- [ ] 4.2 Configurar variáveis secretas (URL do Railway)
- [ ] 4.3 Implementar proxy seguro
- [ ] 4.4 Configurar rota: api.flyerx.com/* → Worker
- [ ] 4.5 Testar conexão Worker → Railway

### Fase 5: Cloudflare Pages - Frontend (20 min)
- [ ] 5.1 Conectar repositório GitHub
- [ ] 5.2 Configurar build (apps/web)
- [ ] 5.3 Configurar variáveis de ambiente (APENAS URLs públicas)
- [ ] 5.4 Deploy
- [ ] 5.5 Configurar domínio: app.flyerx.com

### Fase 6: Segurança Final (15 min)
- [ ] 6.1 Verificar que NENHUM token está no frontend
- [ ] 6.2 Configurar Rate Limiting no Cloudflare
- [ ] 6.3 Configurar regras de WAF
- [ ] 6.4 Testar proteção contra bots

### Fase 7: Smoke Test (30 min)
- [ ] 7.1 Testar login/registro
- [ ] 7.2 Testar depósito (valor mínimo real)
- [ ] 7.3 Testar saque (valor mínimo real)
- [ ] 7.4 Verificar split funcionando
- [ ] 7.5 Verificar logs no Railway

---

## Detalhamento por Fase

### Fase 1: GitHub

```bash
cd "C:\Users\55319\Desktop\PROJETOS 2026\Flyerx - Organizado"

# Commit das mudanças
git add .
git commit -m "chore: reorganiza estrutura do monorepo

- flyerx-backend → services/withdrawal-service
- flyerx-web → apps/web
- flyerx-admin → apps/admin
- flyerx-mobile → apps/mobile
- Atualiza CLAUDE.md e documentação"

# Criar repo no GitHub (via CLI ou web)
gh repo create flyerx --private

# Push
git remote set-url origin https://github.com/SEU-USUARIO/flyerx.git
git push -u origin master
```

---

### Fase 2: Railway

#### 2.3 Variáveis Laravel (api/)

```env
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:GERAR_COM_php_artisan_key:generate
APP_URL=https://api.flyerx.com

DB_CONNECTION=pgsql
DATABASE_URL=${Postgres.DATABASE_URL}

# Eulen
EULEN_API_URL=https://depix.eulen.app/api
EULEN_API_TOKEN=seu_token_jwt

# Carteira Split (SEGREDO)
PARTNER_DEPIX_ADDRESS=seu_endereco_liquid
PARTNER_FEE_PERCENT=0.02

# LWK Service (interno)
LWK_SERVICE_URL=http://withdrawal-service.railway.internal:8000
LWK_API_KEY=chave_interna_gerada

# JWT
JWT_SECRET=gerar_com_openssl_rand_base64_32
```

#### 2.6 Variáveis Python (services/withdrawal-service/)

```env
APP_ENV=production
DATABASE_URL=${Postgres.DATABASE_URL}

# LWK
LWK_NETWORK=liquid
LWK_ELECTRUM_URL=blockstream.info:995
LWK_MNEMONIC=suas_12_palavras_NUNCA_expor

# Eulen
EULEN_API_URL=https://depix.eulen.app/api
EULEN_API_TOKEN=seu_token_jwt

# Taxas
PARTNER_WITHDRAW_FEE_PERCENT=0.015
PARTNER_WITHDRAW_FEE_MIN_CENTS=50

# Auth interna
INTERNAL_API_KEY=mesma_chave_do_laravel
```

---

### Fase 4: Cloudflare Worker

```javascript
// workers/api-proxy.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Bloquear paths sensíveis
    if (url.pathname.includes('/internal/')) {
      return new Response('Forbidden', { status: 403 });
    }

    // Rate limit básico (usar Cloudflare Rate Limiting para produção)

    // Proxy para Railway
    const railwayUrl = env.RAILWAY_URL + url.pathname + url.search;

    const response = await fetch(railwayUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        'X-Forwarded-For': request.headers.get('CF-Connecting-IP'),
        'X-Real-IP': request.headers.get('CF-Connecting-IP'),
      },
      body: request.body,
    });

    // Adicionar headers de segurança
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-Frame-Options', 'DENY');

    return newResponse;
  }
}
```

**Secrets do Worker:**
```
RAILWAY_URL = https://flyerx-api-production.up.railway.app
```

---

### Fase 5: Cloudflare Pages

**Build settings:**
```
Framework preset: Next.js
Root directory: apps/web
Build command: pnpm build
Output directory: .next
```

**Environment variables (APENAS públicas):**
```
NEXT_PUBLIC_API_URL=https://api.flyerx.com
NEXT_PUBLIC_APP_URL=https://app.flyerx.com
```

**NÃO colocar:**
- ❌ EULEN_API_TOKEN
- ❌ INTERNAL_API_KEY
- ❌ Qualquer segredo

---

## Onde fica cada segredo

| Segredo | Onde fica | Quem acessa |
|---------|-----------|-------------|
| Token Eulen | Railway (Laravel) | Só Laravel |
| Carteira Split | Railway (Laravel) | Só Laravel |
| LWK Mnemonic | Railway (Python) | Só Python |
| API Key interna | Railway (ambos) | Laravel ↔ Python |
| URL do Railway | Cloudflare Worker | Só Worker |
| JWT Secret | Railway (Laravel) | Só Laravel |

**Frontend (Cloudflare Pages): ZERO segredos**

---

## Comandos úteis pós-deploy

```bash
# Ver logs do Laravel
railway logs -s api

# Ver logs do Python
railway logs -s withdrawal-service

# Testar health do Laravel
curl https://api.flyerx.com/health

# Testar via Worker
curl https://api.flyerx.com/v1/auth/me -H "Authorization: Bearer TOKEN"
```

---

## Estimativa de tempo

| Fase | Tempo |
|------|-------|
| GitHub | 15 min |
| Railway | 30 min |
| Cloudflare Setup | 20 min |
| Worker | 30 min |
| Pages | 20 min |
| Segurança | 15 min |
| Smoke Test | 30 min |
| **Total** | **~2.5 horas** |

---

## Próximos passos pós-MVP

1. **Cloudflare Tunnel** — Eliminar IP público do Railway
2. **Rate Limiting avançado** — Regras por endpoint
3. **Alertas** — Configurar notificações de erro
4. **Backup** — Automatizar backup do PostgreSQL
5. **Monitoramento** — Integrar com serviço de APM
