# Deploy no Railway - Guia Rápido

## Pré-requisitos

Antes de começar, você precisa ter:
- [ ] Conta no Railway (https://railway.app)
- [ ] Token JWT da Eulen (via Telegram Bot)
- [ ] Mnemonic LWK de 12 palavras (para produção)

---

## Passo 1: Criar Projeto no Railway

1. Acesse https://railway.app
2. Clique em **"Start a New Project"**
3. Escolha **"Empty Project"**
4. Renomeie o projeto para **"Flyerx"**

---

## Passo 2: Adicionar PostgreSQL

1. No projeto, clique em **"+ New"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Aguarde o provisionamento
4. Clique no serviço PostgreSQL e vá em **"Variables"**
5. Copie a variável `DATABASE_URL` (será usada no backend)

---

## Passo 3: Deploy do Backend Python

### 3.1 Conectar Repositório

1. Clique em **"+ New"** → **"GitHub Repo"**
2. Autorize o Railway a acessar seu GitHub
3. Selecione o repositório **flyerx-backend**
4. Railway detectará automaticamente Python + Nixpacks

### 3.2 Configurar Variáveis de Ambiente

No serviço do backend, vá em **"Variables"** e adicione:

```
APP_ENV=production
APP_DEBUG=false

# Copie do serviço PostgreSQL:
DATABASE_URL=${{Postgres.DATABASE_URL}}

# LWK - Liquid Wallet Kit (PRODUÇÃO)
LWK_NETWORK=liquid
LWK_ELECTRUM_URL=blockstream.info:995
LWK_MNEMONIC=suas doze palavras do mnemonic aqui nunca compartilhar

# API Eulen
EULEN_API_URL=https://depix.eulen.app/api
EULEN_API_TOKEN=seu_token_jwt_da_eulen
EULEN_MOCK_MODE=false

# Taxas
PARTNER_WITHDRAW_FEE_PERCENT=0.015
PARTNER_WITHDRAW_FEE_FIXED_CENTS=0
PARTNER_WITHDRAW_FEE_MIN_CENTS=50

# CORS (adicionar domínio do frontend depois)
CORS_ORIGINS=https://seu-frontend.vercel.app

# Autenticação interna
INTERNAL_API_KEY=gerar_com_openssl_rand_hex_32
```

**IMPORTANTE:** Para gerar uma chave segura para INTERNAL_API_KEY, execute no terminal:
```bash
openssl rand -hex 32
```

### 3.3 Configurar Domínio

1. No serviço, vá em **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"**
3. Anote a URL (ex: `flyerx-backend-production.up.railway.app`)

### 3.4 Verificar Deploy

Após o deploy, acesse:
```
https://seu-dominio.up.railway.app/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "environment": "production",
  "lwk_connected": true
}
```

---

## Passo 4: Testar Endpoint de Limite

```bash
curl -X GET "https://seu-dominio.up.railway.app/internal/withdrawals/limit/52998224725" \
  -H "X-API-Key: sua_internal_api_key"
```

Resposta esperada:
```json
{
  "tax_number": "529.***.***-25",
  "daily_limit_cents": 500000,
  "remaining_cents": 500000
}
```

---

## Variáveis de Ambiente - Referência Completa

| Variável | Descrição | Exemplo Produção |
|----------|-----------|------------------|
| `APP_ENV` | Ambiente | `production` |
| `APP_DEBUG` | Debug mode | `false` |
| `DATABASE_URL` | PostgreSQL | `${{Postgres.DATABASE_URL}}` |
| `LWK_NETWORK` | Rede Liquid | `liquid` (mainnet) |
| `LWK_ELECTRUM_URL` | Servidor Electrum | `blockstream.info:995` |
| `LWK_MNEMONIC` | 12 palavras | (suas palavras) |
| `EULEN_API_URL` | URL Eulen | `https://depix.eulen.app/api` |
| `EULEN_API_TOKEN` | Token JWT | (seu token) |
| `EULEN_MOCK_MODE` | Mock mode | `false` |
| `PARTNER_WITHDRAW_FEE_PERCENT` | Taxa % | `0.015` |
| `PARTNER_WITHDRAW_FEE_FIXED_CENTS` | Taxa fixa | `0` |
| `PARTNER_WITHDRAW_FEE_MIN_CENTS` | Taxa mínima | `50` |
| `CORS_ORIGINS` | Origens CORS | `https://app.flyerx.com.br` |
| `INTERNAL_API_KEY` | API Key interna | (64 caracteres hex) |

---

## Troubleshooting

### Build falhou
- Verifique os logs em **"Deployments"** → clique no deploy → **"View Logs"**
- Comum: dependência faltando no `requirements.txt`

### Health check falhou
- Verifique se `DATABASE_URL` está correto
- Verifique se `LWK_MNEMONIC` está configurado

### Erro de CORS
- Adicione a URL do frontend em `CORS_ORIGINS`
- Formato: `https://dominio1.com,https://dominio2.com`

### LWK não conecta
- Verifique `LWK_NETWORK` (liquid para mainnet, liquid-testnet para testnet)
- Verifique `LWK_ELECTRUM_URL` (995 para mainnet, 465 para testnet)

---

## Próximos Passos

Após o backend estar rodando:

1. **Deploy do Frontend no Vercel**
   - Configurar `NEXT_PUBLIC_BACKEND_URL` com a URL do Railway

2. **Testar fluxo completo**
   - Depósito PIX → DePix
   - Saque DePix → PIX

3. **Configurar Webhooks (Fase 2)**
   - Ver `docs/PLANO_WEBHOOKS.md`
