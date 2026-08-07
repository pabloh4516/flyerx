# Flyerx — Monorepo

## O que é o projeto

Plataforma financeira digital (fintech) que oferece carteira digital em BRL com operações PIX — depósitos via QR Code dinâmico, saques via PIX, autenticação 2FA e KYC multinível.

## Mapa do repositório

```
Flyerx/
├── api/                          # Backend principal (Laravel)
├── services/
│   └── withdrawal-service/       # Microserviço de saques (Python)
├── apps/
│   ├── web/                      # Frontend web (Next.js)
│   ├── admin/                    # Painel administrativo (Next.js)
│   └── mobile/                   # App mobile (Expo)
├── docs/                         # Documentação
├── docker/                       # Infraestrutura Docker
└── mockups/                      # Protótipos visuais
```

| Pasta | Stack | Propósito |
|-------|-------|-----------|
| `api/` | PHP 8.4, Laravel 12, PostgreSQL, Redis | **Backend principal** — autenticação, wallet, ledger, compliance. Arquitetura DDD/Clean Architecture. |
| `services/withdrawal-service/` | Python 3.11+, FastAPI, SQLAlchemy, LWK | Microserviço de saques DePix→PIX. Chamado **somente pelo Laravel**, nunca pelo frontend. |
| `apps/web/` | Next.js 15, React 19, Tailwind 4, shadcn, pnpm | Frontend web do cliente |
| `apps/admin/` | Next.js 15, React 19, Tailwind 4, shadcn, recharts, pnpm | Painel administrativo |
| `apps/mobile/` | Expo 57, React Native 0.86, NativeWind | App mobile (iOS/Android) |
| `docker/` | Dockerfiles, nginx, PHP-FPM, PostgreSQL configs | Infraestrutura de containers |
| `docs/` | Markdown | Documentação de arquitetura, planos, integração |

> **Backend principal = `api/`** (Laravel). O `services/withdrawal-service/` é um microserviço auxiliar interno.

## Arquitetura de segurança

```
Usuário → Cloudflare (Pages/Workers) → Railway (api/ + services/)
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                   │
                    ▼                                                   ▼
            Laravel (api/)                                    Python (withdrawal-service/)
            - Token Eulen                                     - LWK Mnemonic
            - Carteira Split                                  - Rede interna apenas
            - Gateway único
```

**Segredos NUNCA no frontend.** Tokens e credenciais ficam apenas no Railway.

## Estado atual

- **Backend (`api/` + `services/withdrawal-service/`)**: COMPLETO e FUNCIONAL. Modificar apenas quando necessário para integração.
- **apps/web**: Retrofit visual COMPLETO (design system Nocturne). Em fase de integração.
- **apps/admin**: Funcional mas DESATUALIZADO visualmente. Retrofit após apps/web.
- **apps/mobile**: Estrutura criada, não passou pelo retrofit visual. Atualizar após apps/admin.

## Regras para qualquer sessão neste repositório

1. **Backend com cuidado.** Modificações em `api/` ou `services/` devem ser discutidas antes. Para tarefas de frontend, o backend é considerado pronto.

2. **Uma tarefa = uma aplicação.** Nunca misturar mudanças de duas aplicações (web, admin, mobile, backend) na mesma tarefa.

3. **Handoff por markdown.** Handoff entre sessões é feito por documentos markdown no repositório (pasta `docs/`), nunca pela memória da conversa. Ao concluir uma fase de trabalho relevante, persistir o resultado em markdown antes de encerrar.

4. **Tokens de design compartilhados.** Decisões de design (tokens, paleta, radius, spacing, ícones) que valem para mais de uma aplicação ficam em `docs/design/` na raiz. Cada aplicação implementa esses tokens no seu próprio stack.

5. **Retrofit visual ≠ mudança funcional.** Migração/correção visual NUNCA muda funcionalidade. Bugs ou melhorias encontrados durante trabalho visual devem ser anotados em `TODO.md`, não corrigidos na hora.

6. **Verificar antes de criar.** Antes de criar qualquer arquivo ou componente novo, verificar se já existe algo equivalente.

7. **Respeitar CLAUDE.md locais.** `apps/web` possui CLAUDE.md próprio com regras específicas do design system Nocturne. Sessões dentro de `apps/web` devem respeitar ambos os arquivos.

8. **Fontes de verdade documentais.** As únicas fontes de verdade são:
   - `docs/design/` — Design system Nocturne, decisões, templates
   - `docs/integracao/` — Catálogos dos backends (gerados a partir do código)
   - `docs/design/CONTINUIDADE.md` — Handoff entre sessões
   - `CLAUDE.md` (raiz e apps/web) — Regras do repositório

   Documentos em `docs/_arquivo/` estão **obsoletos** — nunca usar.

## Comandos úteis

### Docker (backend completo)

```bash
# Primeira instalação
make install

# Subir todos os containers
make up

# Rodar migrations + seeders
make setup

# Logs
make logs

# Shell no container PHP
make shell

# Rodar testes
make test
```

A API fica disponível em `http://localhost:8000`.

### apps/web (frontend)

```bash
cd apps/web
pnpm install
pnpm dev
```

### apps/admin (painel)

```bash
cd apps/admin
pnpm install
pnpm dev
```

### apps/mobile (app)

```bash
cd apps/mobile
npm install
npx expo start
```

### services/withdrawal-service (microserviço)

```bash
cd services/withdrawal-service
pip install -r requirements.txt
uvicorn src.main:app --reload
```

## Deploy

| Componente | Plataforma | URL |
|------------|------------|-----|
| `apps/web` | Cloudflare Pages | app.flyerx.com |
| `api/` | Railway | (interno via Cloudflare Worker) |
| `services/withdrawal-service` | Railway | (rede interna, sem URL pública) |

**Cloudflare na frente para:** DDoS protection, WAF, Rate Limiting, CDN, SSL automático.
