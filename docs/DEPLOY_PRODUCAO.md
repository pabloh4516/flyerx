# Deploy para Produção - Flyerx

## Visão Geral

Este documento descreve todos os passos necessários para colocar o sistema Flyerx em produção (fase de testes).

**Componentes:**
- Backend Python (LWK) - Saques com taxa de parceiro
- Frontend Web (Next.js) - Interface do usuário
- Laravel API - Autenticação e lógica de negócio (se aplicável)

---

## Pré-requisitos

### Infraestrutura
- [ ] Servidor Linux (Ubuntu 22.04+ recomendado)
- [ ] Docker e Docker Compose instalados
- [ ] Domínio configurado (ex: `api.flyerx.com`, `app.flyerx.com`)
- [ ] Certificado SSL (Let's Encrypt ou similar)
- [ ] PostgreSQL (produção) ou acesso a banco gerenciado

### Contas e Tokens
- [ ] Token JWT da Eulen (via Telegram Bot)
- [ ] Mnemonic LWK de produção (12 palavras)
- [ ] Acesso ao Vercel (para frontend) ou servidor próprio

---

## 1. Backend Python (flyerx-backend)

### 1.1 Variáveis de Ambiente de Produção

Criar arquivo `.env.production`:

```env
# ===== Ambiente =====
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=INFO

# ===== Banco de Dados =====
# Usar PostgreSQL em produção
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/flyerx_prod

# ===== LWK (Liquid Wallet Kit) =====
LWK_NETWORK=liquid
LWK_ELECTRUM_URL=blockstream.info:995
# IMPORTANTE: Mnemonic de produção (NUNCA commitar!)
LWK_MNEMONIC=palavra1 palavra2 palavra3 palavra4 palavra5 palavra6 palavra7 palavra8 palavra9 palavra10 palavra11 palavra12

# ===== API Eulen =====
EULEN_API_URL=https://depix.eulen.app/api
EULEN_API_TOKEN=seu_token_jwt_producao
EULEN_MOCK_MODE=false

# ===== Taxas do Parceiro Flyerx =====
# Ajustar conforme modelo de negócio
PARTNER_WITHDRAW_FEE_PERCENT=0.015    # 1.5%
PARTNER_WITHDRAW_FEE_FIXED_CENTS=0    # R$ 0,00 fixo
PARTNER_WITHDRAW_FEE_MIN_CENTS=100    # Mínimo R$ 1,00

# ===== Autenticação Interna =====
# Gerar chave segura: openssl rand -hex 32
INTERNAL_API_KEY=sua_chave_segura_de_64_caracteres_aqui

# ===== CORS =====
ALLOWED_ORIGINS=https://app.flyerx.com,https://admin.flyerx.com

# ===== Webhooks (Fase 2) =====
# EULEN_WEBHOOK_SECRET=seu_secret_32_chars
```

### 1.2 Dockerfile

```dockerfile
# flyerx-backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY src/ ./src/

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando de produção
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 1.3 Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  flyerx-backend:
    build:
      context: ./flyerx-backend
      dockerfile: Dockerfile
    container_name: flyerx-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    env_file:
      - ./flyerx-backend/.env.production
    volumes:
      - ./flyerx-backend/data:/app/data  # Para SQLite local (dev)
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - flyerx-network

  # PostgreSQL (opcional - pode usar serviço gerenciado)
  postgres:
    image: postgres:15-alpine
    container_name: flyerx-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: flyerx
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: flyerx_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - flyerx-network

networks:
  flyerx-network:
    driver: bridge

volumes:
  postgres_data:
```

### 1.4 Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/api.flyerx.com
server {
    listen 80;
    server_name api.flyerx.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.flyerx.com;

    ssl_certificate /etc/letsencrypt/live/api.flyerx.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.flyerx.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # Health check público
    location /health {
        proxy_pass http://localhost:8000/health;
    }
}
```

### 1.5 Comandos de Deploy

```bash
# No servidor de produção

# 1. Clonar repositório
git clone https://github.com/seu-usuario/flyerx-backend.git
cd flyerx-backend

# 2. Configurar variáveis de ambiente
cp .env.example .env.production
nano .env.production  # Editar com valores de produção

# 3. Build e start
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Verificar logs
docker-compose -f docker-compose.prod.yml logs -f

# 5. Verificar health
curl https://api.flyerx.com/health
```

---

## 2. Frontend Web (flyerx-web)

### 2.1 Variáveis de Ambiente de Produção

```env
# .env.production (Vercel ou servidor)

# Desabilitar mock
NEXT_PUBLIC_MOCK_API=false

# URL da API Laravel
NEXT_PUBLIC_API_URL=https://laravel.flyerx.com/api

# URL do Backend Python (LWK)
NEXT_PUBLIC_BACKEND_URL=https://api.flyerx.com

# Usar backend LWK para saques
NEXT_PUBLIC_USE_BACKEND_LWK=true

# API Eulen (para depósitos diretos)
NEXT_PUBLIC_PIX2DEPIX_API_URL=https://depix.eulen.app/api
NEXT_PUBLIC_PIX2DEPIX_TOKEN=seu_token_jwt_producao
```

### 2.2 Deploy no Vercel

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
cd flyerx-web
vercel --prod

# 4. Configurar variáveis no dashboard
# Vercel Dashboard > Settings > Environment Variables
```

### 2.3 Deploy Manual (Docker)

```dockerfile
# flyerx-web/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 3. Banco de Dados

### 3.1 Migração para PostgreSQL

```bash
# No servidor com acesso ao banco

# 1. Criar banco
createdb flyerx_prod

# 2. Rodar migrações (se usar Alembic)
alembic upgrade head

# Ou criar tabelas automaticamente (desenvolvimento)
# O SQLAlchemy cria as tabelas no startup se não existirem
```

### 3.2 Backup Automatizado

```bash
# Crontab para backup diário
0 3 * * * pg_dump -U flyerx flyerx_prod | gzip > /backups/flyerx_$(date +\%Y\%m\%d).sql.gz
```

---

## 4. Checklist de Deploy

### Antes do Deploy

- [ ] Gerar mnemonic LWK de produção (12 palavras)
- [ ] Obter token JWT da Eulen para produção
- [ ] Gerar INTERNAL_API_KEY segura (`openssl rand -hex 32`)
- [ ] Configurar domínios DNS
- [ ] Obter certificados SSL

### Backend Python

- [ ] Criar `.env.production` com variáveis corretas
- [ ] Build Docker image
- [ ] Testar health check: `curl https://api.flyerx.com/health`
- [ ] Testar endpoint de limite: `curl https://api.flyerx.com/internal/withdrawals/limit/12345678901`
- [ ] Verificar logs: `docker logs flyerx-backend`

### Frontend Web

- [ ] Configurar variáveis no Vercel/servidor
- [ ] Deploy e verificar build
- [ ] Testar página de login
- [ ] Testar página de depósito
- [ ] Testar página de saque
- [ ] Verificar consulta de limite por CPF

### Segurança

- [ ] HTTPS habilitado em todos os serviços
- [ ] CORS configurado corretamente
- [ ] Rate limiting no Nginx
- [ ] Firewall configurado (apenas portas 80, 443)
- [ ] Variáveis sensíveis não commitadas

---

## 5. Testes em Produção

### 5.1 Teste de Depósito

```bash
# 1. Acessar app.flyerx.com
# 2. Fazer login
# 3. Ir para /deposit
# 4. Informar valor (ex: R$ 10,00)
# 5. Verificar QR Code gerado
# 6. Pagar com PIX real (valor baixo para teste)
# 7. Verificar se status muda para "depix_sent"
```

### 5.2 Teste de Saque

```bash
# 1. Acessar app.flyerx.com
# 2. Ir para /withdraw
# 3. Informar CPF/CNPJ do beneficiário
# 4. Verificar se limite aparece
# 5. Preencher valor, chave PIX, CPF do titular
# 6. Criar saque
# 7. Verificar endereço Liquid gerado
# 8. Enviar DePix para o endereço (de carteira externa)
# 9. Verificar se PIX é enviado ao beneficiário
```

### 5.3 Teste de Limite

```bash
# Via curl
curl -X GET "https://api.flyerx.com/internal/withdrawals/limit/52998224725" \
  -H "X-API-Key: sua_chave_interna"

# Resposta esperada:
{
  "tax_number": "529.***.***-25",
  "daily_limit_cents": 500000,
  "daily_volume_cents": 0,
  "remaining_cents": 500000,
  "daily_limit_reais": 5000.0,
  "daily_volume_reais": 0.0,
  "remaining_reais": 5000.0,
  "has_euid": false
}
```

---

## 6. Monitoramento

### 6.1 Logs

```bash
# Backend Python
docker logs -f flyerx-backend

# Com filtro de erro
docker logs flyerx-backend 2>&1 | grep -i error
```

### 6.2 Health Checks

```bash
# Verificar saúde do backend
curl https://api.flyerx.com/health

# Resposta esperada:
{
  "status": "healthy",
  "version": "1.0.0",
  "lwk_connected": true,
  "database_connected": true
}
```

### 6.3 Alertas (Recomendado)

- Configurar alertas para:
  - Health check falhou
  - Erros 5xx > 10/minuto
  - Latência > 5 segundos
  - Disco > 80%

---

## 7. Rollback

Se algo der errado:

```bash
# 1. Voltar para versão anterior
docker-compose -f docker-compose.prod.yml down
git checkout <commit-anterior>
docker-compose -f docker-compose.prod.yml up -d --build

# 2. Ou restaurar backup do banco
gunzip < /backups/flyerx_20260803.sql.gz | psql -U flyerx flyerx_prod
```

---

## 8. Cronograma Sugerido

| Dia | Tarefa |
|-----|--------|
| **Dia 1** | Configurar servidor, domínios, SSL |
| **Dia 2** | Deploy backend Python + testes |
| **Dia 3** | Deploy frontend + testes integrados |
| **Dia 4** | Testes completos (depósito + saque real) |
| **Dia 5** | Monitoramento e ajustes finais |

---

## 9. Contatos de Emergência

| Serviço | Contato |
|---------|---------|
| Eulen (API) | Telegram: @eulen_support |
| Servidor | Seu provedor de hospedagem |
| Domínio/SSL | Seu registrador |

---

## 10. Próximos Passos (Pós-Deploy)

1. **Fase 2 - Webhooks**: Implementar endpoints de webhook (ver `PLANO_WEBHOOKS.md`)
2. **Fase 3 - Notificações**: Push notifications, email
3. **Fase 4 - Admin Panel**: Dashboard administrativo
4. **Fase 5 - Mobile**: App React Native

---

## Arquivos de Configuração

```
flyerx/
├── docs/
│   ├── DEPLOY_PRODUCAO.md    # Este documento
│   └── PLANO_WEBHOOKS.md     # Plano para webhooks
├── flyerx-backend/
│   ├── .env.production       # Variáveis de produção (NÃO COMMITAR)
│   ├── Dockerfile
│   └── docker-compose.prod.yml
├── flyerx-web/
│   ├── .env.production       # Variáveis de produção
│   └── Dockerfile
└── nginx/
    └── api.flyerx.com.conf   # Config Nginx
```
