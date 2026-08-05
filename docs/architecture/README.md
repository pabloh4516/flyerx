# Flyerx - Documentação de Arquitetura

## Plataforma Financeira Digital

Documentação completa da arquitetura da plataforma Flyerx, uma fintech que oferece carteira digital com operações PIX.

---

## Documentos

| # | Documento | Descrição |
|---|-----------|-----------|
| 01 | [Visão Geral](./01-VISAO-GERAL.md) | Stack tecnológica, princípios, bounded contexts |
| 02 | [Estrutura de Pastas](./02-ESTRUTURA-PASTAS.md) | Organização do projeto Laravel (DDD/Clean Architecture) |
| 03 | [Banco de Dados - Parte 1](./03-BANCO-DE-DADOS-PARTE1.md) | Identity Context (users, devices, sessions, roles) |
| 03 | [Banco de Dados - Parte 2](./03-BANCO-DE-DADOS-PARTE2.md) | Wallet e Payment Context |
| 03 | [Banco de Dados - Parte 3](./03-BANCO-DE-DADOS-PARTE3.md) | Ledger, Fee, Compliance Context |
| 03 | [Banco de Dados - Parte 4](./03-BANCO-DE-DADOS-PARTE4.md) | Notification, Config, Integration, Views |
| 04 | [Fluxogramas](./04-FLUXOGRAMAS.md) | Fluxos de depósito, saque, autenticação, KYC |
| 05 | [Estratégia Ledger/Wallet](./05-ESTRATEGIA-LEDGER-WALLET.md) | Double-entry, composição de saldo, reservas |
| 06 | [Integração Eulen](./06-ESTRATEGIA-INTEGRACAO-EULEN.md) | Abstração de provider, HTTP client, webhooks |
| 07 | [Segurança](./07-ESTRATEGIA-SEGURANCA.md) | Autenticação, 2FA, rate limiting, criptografia |
| 08 | [Sistema de Taxas](./08-ESTRATEGIA-TAXAS.md) | Configuração flexível, cálculos, relatórios |
| 09 | [Roadmap](./09-ROADMAP.md) | Fases de desenvolvimento, cronograma, milestones |
| 10 | [Riscos e Validações](./10-RISCOS-E-VALIDACOES.md) | Riscos técnicos, pontos de validação Eulen, ADRs |

---

## Resumo Executivo

### O que é o Flyerx?

Plataforma financeira digital que permite:
- Criar conta com autenticação segura (2FA)
- Carteira digital em BRL
- Depósitos via PIX (QR Code dinâmico)
- Saques via PIX
- Sistema de taxas configurável
- KYC em múltiplos níveis
- Painel administrativo completo

### Stack Tecnológica

| Componente | Tecnologia |
|------------|------------|
| Backend | PHP 8.4 + Laravel 12 |
| Banco de Dados | PostgreSQL |
| Cache/Queue | Redis + Horizon |
| Admin | Vue 3 + Inertia |
| Mobile | Flutter |
| Infraestrutura | Docker + Kubernetes |
| Payment Provider | Eulen (abstração para troca futura) |

### Arquitetura

- **DDD (Domain-Driven Design)**: Bounded contexts bem definidos
- **Clean Architecture**: Camadas Domain, Application, Infrastructure, HTTP
- **CQRS**: Commands e Queries separados
- **Double-Entry Ledger**: Auditabilidade total de movimentações
- **Event-Driven**: Domain events para desacoplamento

### Bounded Contexts

1. **Identity**: Usuários, autenticação, permissões
2. **Wallet**: Carteiras, saldos, reservas
3. **Payment**: Depósitos, saques
4. **Ledger**: Lançamentos contábeis (imutável)
5. **Compliance**: KYC, documentos
6. **Fee**: Configuração e cálculo de taxas
7. **Audit**: Logs de auditoria
8. **Notification**: Push, email, SMS
9. **Integration**: Providers externos
10. **Admin**: Painel administrativo
11. **Config**: Configurações do sistema

---

## Decisões Chave

### Por que Ledger Double-Entry?
- Saldo é resultado da soma de lançamentos (nunca armazenado)
- Impossível ter inconsistências
- Auditoria completa e imutável
- Padrão da indústria financeira

### Por que Abstração de Provider?
- Desacopla negócio do provider (Eulen)
- Permite trocar provider sem reescrever código
- Facilita testes com mocks
- Múltiplos providers simultâneos no futuro

### Por que Vue + Inertia (não Nuxt)?
- Painel admin não precisa de SSR
- Integração nativa com Laravel
- Menor complexidade de deploy
- Single deployment

---

## Próximos Passos

Após aprovação desta arquitetura:

1. **Setup do ambiente** (Docker, Laravel, PostgreSQL)
2. **Autenticação** (JWT, 2FA, device tracking)
3. **Ledger + Wallet** (estrutura financeira)
4. **Integração Eulen** (depósitos e saques)
5. **Painel Admin** (Vue + Inertia)
6. **App Flutter** (mobile)

---

## Pontos Pendentes

Alguns itens da documentação da Eulen precisam de validação:

| Item | Status |
|------|--------|
| Validação de assinatura de webhook | Indefinido |
| Eventos de webhook disponíveis | Parcial |
| Rate limits específicos | Indefinido |
| Ambiente sandbox | Mencionado, sem detalhes |

Ver documento [10-RISCOS-E-VALIDACOES.md](./10-RISCOS-E-VALIDACOES.md) para detalhes.

---

**Data**: Agosto 2026
**Autor**: Claude (Staff Software Engineer / Solution Architect)
**Status**: Aguardando aprovação para implementação
