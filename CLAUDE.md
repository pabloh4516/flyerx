# Flyerx — Monorepo

## O que é o projeto

Plataforma financeira digital (fintech) que oferece carteira digital em BRL com operações PIX — depósitos via QR Code dinâmico, saques via PIX, autenticação 2FA e KYC multinível.

## Mapa do repositório

| Pasta | Stack | Propósito |
|-------|-------|-----------|
| `api/` | PHP 8.4, Laravel 12, PostgreSQL, Redis | **API principal** — toda lógica de negócio, autenticação, wallet, ledger, compliance. Arquitetura DDD/Clean Architecture. |
| `flyerx-backend/` | Python 3.11+, FastAPI, SQLAlchemy | Microserviço LWK (Liquid Wallet Kit) — processa saques DePix→PIX. Chamado **somente pelo Laravel**, nunca pelo frontend. |
| `flyerx-web/` | Next.js 16.3, React 19, Tailwind 4, shadcn, pnpm | Frontend web do cliente |
| `flyerx-admin/` | Next.js 16.3, React 19, Tailwind 4, shadcn, recharts, pnpm | Painel administrativo |
| `flyerx-mobile/` | Expo 57, React Native 0.86, NativeWind | App mobile (iOS/Android) |
| `docker/` | Dockerfiles, nginx, PHP-FPM, PostgreSQL configs | Infraestrutura de containers |
| `docs/` | Markdown | Documentação de arquitetura, planos, integração |
| `mockups/` | HTML/CSS estáticos | Protótipos visuais das telas |

> **Backend principal = `api/`** (Laravel). O `flyerx-backend/` é um microserviço auxiliar interno.

## Estado atual

- **Backend (`api/` + `flyerx-backend/`)**: COMPLETO, FUNCIONAL e estável em uso. Não deve ser modificado.
- **flyerx-web**: Em retrofit visual (design system Nocturne) — em andamento — documentos do retrofit em `docs/design/`.
- **flyerx-admin**: Estrutura e páginas criadas no início do projeto, funcional mas DESATUALIZADO em relação ao padrão visual atual. Não passou pelo retrofit do design system Nocturne. Retrofit será feito depois do flyerx-web.
- **flyerx-mobile**: Mesma situação — páginas criadas no início do projeto, não passou pelo retrofit visual. Será atualizado depois do flyerx-web e flyerx-admin.

## Regras para qualquer sessão neste repositório

1. **O backend está pronto.** NUNCA modificar arquivos de `api/` ou `flyerx-backend/` em tarefas de frontend. Se uma mudança de API parecer necessária, PARAR e perguntar ao usuário antes de qualquer alteração.

2. **Uma tarefa = uma aplicação.** Nunca misturar mudanças de duas aplicações (web, admin, mobile, backend) na mesma tarefa.

3. **Handoff por markdown.** Handoff entre sessões é feito por documentos markdown no repositório (pasta `docs/`), nunca pela memória da conversa. Ao concluir uma fase de trabalho relevante, persistir o resultado em markdown antes de encerrar.

4. **Tokens de design compartilhados.** Decisões de design (tokens, paleta, radius, spacing, ícones) que valem para mais de uma aplicação ficam em `docs/design/` na raiz. Cada aplicação implementa esses tokens no seu próprio stack.

5. **Retrofit visual ≠ mudança funcional.** Migração/correção visual NUNCA muda funcionalidade. Bugs ou melhorias encontrados durante trabalho visual devem ser anotados em `TODO.md`, não corrigidos na hora.

6. **Verificar antes de criar.** Antes de criar qualquer arquivo ou componente novo, verificar se já existe algo equivalente.

7. **Respeitar CLAUDE.md locais.** `flyerx-web` possui (ou possuirá) um CLAUDE.md próprio com regras específicas do design system Nocturne. Sessões dentro de `flyerx-web` devem respeitar ambos os arquivos.

8. **Fontes de verdade documentais.** As únicas fontes de verdade são:
   - `docs/design/` — Design system Nocturne, decisões, templates
   - `docs/integracao/` — Catálogos dos backends (gerados a partir do código)
   - `CONTINUIDADE.md` — Handoff entre sessões
   - `CLAUDE.md` (raiz e flyerx-web) — Regras do repositório

   Documentos em `docs/_arquivo/` estão **obsoletos** — nunca usar. Qualquer documento fora dessas fontes deve ser tratado com desconfiança e confirmado com o usuário antes de embasar decisões. A documentação atualizada dos backends são os catálogos em `docs/integracao/` (gerados a partir do código) — READMEs antigos de `api/` e `flyerx-backend/` não são fonte de verdade.

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

# Gerar documentação Swagger
make docs
```

A API fica disponível em `http://localhost:8000`.

### flyerx-web

```bash
cd flyerx-web
pnpm install
pnpm dev
```

### flyerx-admin

```bash
cd flyerx-admin
pnpm install
pnpm dev
```

### flyerx-mobile

```bash
cd flyerx-mobile
npm install
npx expo start
```
