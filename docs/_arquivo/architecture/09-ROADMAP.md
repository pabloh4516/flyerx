# Flyerx - Roadmap de Desenvolvimento

## 11. Plano de Desenvolvimento em Fases

### 11.1 Visão Geral das Fases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROADMAP DE DESENVOLVIMENTO                           │
└─────────────────────────────────────────────────────────────────────────────┘

 FASE 1                FASE 2                FASE 3               FASE 4
 FUNDAÇÃO              CORE FINANCEIRO       ADMIN & COMPLIANCE   PRODUÇÃO
 ════════              ═══════════════       ══════════════════   ════════

┌──────────┐          ┌──────────┐          ┌──────────┐         ┌──────────┐
│ Setup    │          │ Wallet   │          │ Painel   │         │ Deploy   │
│ Docker   │────────▶ │ Ledger   │────────▶ │ Admin    │───────▶ │ CI/CD    │
│ Laravel  │          │ Depósito │          │ KYC      │         │ Monitor  │
│ Auth     │          │ Saque    │          │ Reports  │         │ Scale    │
└──────────┘          └──────────┘          └──────────┘         └──────────┘

```

---

## FASE 1: FUNDAÇÃO

### Objetivos
- Configurar ambiente de desenvolvimento completo
- Implementar sistema de autenticação robusto
- Criar estrutura base do projeto (DDD/Clean Architecture)
- Configurar CI/CD básico

### Entregáveis

#### 1.1 Setup do Projeto
- [ ] Docker Compose (PHP 8.4, PostgreSQL, Redis, Nginx)
- [ ] Laravel 12 com estrutura de pastas DDD
- [ ] Configuração de ambiente (.env, configs)
- [ ] Makefile com comandos úteis
- [ ] Git hooks (pre-commit, lint)

#### 1.2 Banco de Dados Base
- [ ] Migrations: users, roles, permissions
- [ ] Migrations: user_devices, user_sessions, password_resets
- [ ] Migrations: user_two_factor
- [ ] Seeders para dados iniciais
- [ ] Factories para testes

#### 1.3 Domain Layer
- [ ] Entities: User, Device, Session
- [ ] Value Objects: Email, TaxNumber, Password, PhoneNumber
- [ ] Domain Events base
- [ ] Exceptions base
- [ ] Contracts/Interfaces

#### 1.4 Infrastructure Layer
- [ ] Eloquent Models
- [ ] Repository implementations
- [ ] Mappers (Entity <-> Model)

#### 1.5 Autenticação
- [ ] Registro de usuário (com validação)
- [ ] Login (email + senha)
- [ ] JWT + Refresh Token
- [ ] Logout (revogação de token)
- [ ] Device tracking básico
- [ ] Rate limiting

#### 1.6 Recuperação de Senha
- [ ] Solicitar reset
- [ ] Validar token
- [ ] Alterar senha

#### 1.7 Two-Factor Authentication
- [ ] Setup 2FA (TOTP)
- [ ] Verificação 2FA
- [ ] Backup codes
- [ ] Desabilitar 2FA

#### 1.8 Testes
- [ ] Unit tests do domínio
- [ ] Feature tests de autenticação
- [ ] Test coverage > 80%

#### 1.9 Documentação
- [ ] OpenAPI/Swagger para endpoints de auth
- [ ] README com instruções de setup

---

## FASE 2: CORE FINANCEIRO

### Objetivos
- Implementar sistema de Ledger profissional
- Criar Wallet com todos os tipos de saldo
- Integrar com Eulen (depósitos e saques)
- Sistema de taxas básico

### Entregáveis

#### 2.1 Ledger
- [ ] Migrations: ledger_accounts, ledger_transactions, ledger_entries
- [ ] Entities: LedgerAccount, LedgerTransaction, LedgerEntry
- [ ] LedgerService (criar transactions, calcular saldo)
- [ ] Plano de contas inicial
- [ ] Testes de consistência (débito = crédito)

#### 2.2 Wallet
- [ ] Migrations: wallets, balance_reservations, wallet_limits
- [ ] Entities: Wallet, BalanceReservation
- [ ] WalletService (criar, consultar saldo)
- [ ] BalanceCalculatorService
- [ ] ReservationService
- [ ] View materializada de saldos
- [ ] Extrato

#### 2.3 Sistema de Taxas
- [ ] Migrations: fee_configurations, fee_calculations
- [ ] FeeCalculatorService
- [ ] Configurações básicas (deposit, withdrawal)
- [ ] Registro de cálculos

#### 2.4 Integração Eulen - Estrutura
- [ ] PaymentProvider contracts
- [ ] EulenHttpClient com resiliência
- [ ] EulenStatusMapper
- [ ] DTOs de request/response
- [ ] Circuit Breaker

#### 2.5 Depósitos
- [ ] Migrations: deposits, deposit_status_logs
- [ ] DepositService
- [ ] Endpoint: POST /deposits (gerar QR)
- [ ] Endpoint: GET /deposits/{id}
- [ ] Endpoint: GET /deposits (lista)
- [ ] Integração Eulen /deposit
- [ ] Webhook handler para depósitos
- [ ] Job de polling de status
- [ ] Processamento de confirmação (Ledger)

#### 2.6 Saques
- [ ] Migrations: withdrawals, withdrawal_status_logs
- [ ] WithdrawalService
- [ ] Endpoint: POST /withdrawals
- [ ] Endpoint: GET /withdrawals/{id}
- [ ] Validação de saldo
- [ ] Reserva de saldo
- [ ] Integração Eulen /withdraw
- [ ] Webhook handler para saques
- [ ] Estorno automático em falhas
- [ ] Job de expiração de reservas

#### 2.7 Webhooks
- [ ] Endpoint: POST /webhooks/eulen
- [ ] Validação de assinatura (quando documentado)
- [ ] Logging de webhooks
- [ ] Reprocessamento

#### 2.8 Testes
- [ ] Unit tests do Ledger
- [ ] Unit tests da Wallet
- [ ] Integration tests com mock da Eulen
- [ ] Tests de fluxos completos

#### 2.9 Documentação
- [ ] OpenAPI para endpoints financeiros
- [ ] Documentação do Ledger
- [ ] Diagramas de fluxo

---

## FASE 3: ADMIN & COMPLIANCE

### Objetivos
- Painel administrativo funcional
- Sistema de KYC completo
- Relatórios e dashboards
- Auditoria completa

### Entregáveis

#### 3.1 KYC
- [ ] Migrations: kyc_processes, kyc_documents
- [ ] Upload seguro de documentos (S3)
- [ ] KycService
- [ ] Endpoints de KYC para usuário
- [ ] Níveis de KYC e limites
- [ ] Revisão de documentos (admin)

#### 3.2 Painel Admin - Base
- [ ] Vue 3 + Inertia setup
- [ ] Layout base
- [ ] Autenticação admin
- [ ] Middleware de permissões
- [ ] Dashboard inicial

#### 3.3 Painel Admin - Usuários
- [ ] Lista de usuários
- [ ] Detalhes do usuário
- [ ] Histórico de transações
- [ ] Bloqueio/desbloqueio
- [ ] Ajustes manuais de saldo

#### 3.4 Painel Admin - Financeiro
- [ ] Lista de depósitos
- [ ] Lista de saques
- [ ] Aprovação de saques
- [ ] Detalhes de transações
- [ ] Ledger browser

#### 3.5 Painel Admin - KYC
- [ ] Fila de revisão
- [ ] Visualização de documentos
- [ ] Aprovação/rejeição
- [ ] Histórico de decisões

#### 3.6 Painel Admin - Configurações
- [ ] Taxas
- [ ] Limites operacionais
- [ ] Configurações do sistema
- [ ] Provider settings

#### 3.7 Relatórios
- [ ] Dashboard com métricas
- [ ] Relatório de transações
- [ ] Relatório de taxas
- [ ] Relatório de KYC
- [ ] Exportação (CSV, PDF)

#### 3.8 Auditoria
- [ ] Migrations: audit_logs
- [ ] AuditLogger
- [ ] Visualização de logs (admin)
- [ ] Filtros e busca

#### 3.9 Notificações
- [ ] Migrations: notifications, notification_preferences
- [ ] NotificationService
- [ ] Push notifications (Firebase)
- [ ] Email notifications
- [ ] Templates

#### 3.10 Testes
- [ ] Feature tests do admin
- [ ] Tests de KYC
- [ ] Tests de relatórios

---

## FASE 4: PRODUÇÃO

### Objetivos
- Preparar para deploy em produção
- Configurar monitoramento e alertas
- Otimizações de performance
- Documentação completa

### Entregáveis

#### 4.1 CI/CD
- [ ] GitHub Actions pipeline
- [ ] Tests automáticos
- [ ] Build e deploy
- [ ] Staging environment
- [ ] Production deployment

#### 4.2 Infraestrutura
- [ ] Kubernetes manifests
- [ ] Horizontal Pod Autoscaling
- [ ] Database replicas
- [ ] Redis cluster
- [ ] CDN para assets

#### 4.3 Monitoramento
- [ ] Application metrics (Prometheus)
- [ ] Log aggregation (ELK/Loki)
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Alertas configurados

#### 4.4 Performance
- [ ] Query optimization
- [ ] Cache strategy
- [ ] Rate limiting tuning
- [ ] Load testing
- [ ] Stress testing

#### 4.5 Segurança Final
- [ ] Security audit
- [ ] Penetration testing
- [ ] OWASP checklist
- [ ] Backup strategy
- [ ] Disaster recovery plan

#### 4.6 Documentação
- [ ] Runbook operacional
- [ ] Incident response procedures
- [ ] Architecture Decision Records (ADRs)
- [ ] API documentation completa

#### 4.7 App Flutter
- [ ] Setup projeto Flutter
- [ ] Autenticação
- [ ] Wallet/Saldo
- [ ] Depósitos (QR Code)
- [ ] Saques
- [ ] Extrato
- [ ] Perfil
- [ ] KYC
- [ ] Notificações
- [ ] Build Android/iOS

---

## 11.2 Cronograma Estimado

| Fase | Duração Estimada | Dependências |
|------|------------------|--------------|
| Fase 1: Fundação | 3-4 semanas | - |
| Fase 2: Core Financeiro | 5-6 semanas | Fase 1 |
| Fase 3: Admin & Compliance | 4-5 semanas | Fase 2 |
| Fase 4: Produção | 3-4 semanas | Fase 3 |
| **Total** | **15-19 semanas** | |

---

## 11.3 Marcos (Milestones)

| Marco | Descrição | Entregável |
|-------|-----------|------------|
| M1 | Auth funcional | Login, 2FA, device tracking |
| M2 | Wallet operacional | Ledger, saldos, extrato |
| M3 | Depósitos via PIX | QR Code, webhook, crédito |
| M4 | Saques via PIX | Reserva, débito, estorno |
| M5 | Admin básico | Dashboard, usuários, transações |
| M6 | KYC completo | Upload, revisão, níveis |
| M7 | Produção ready | Deploy, monitoramento |
| M8 | App mobile | Flutter Android/iOS |

---

## 11.4 Riscos por Fase

| Fase | Risco | Mitigação |
|------|-------|-----------|
| 1 | Estrutura muito complexa | Começar simples, refatorar depois |
| 2 | Documentação Eulen incompleta | Desenvolver com mocks, validar depois |
| 2 | Bugs no Ledger | Testes extensivos, reconciliação |
| 3 | Escopo do admin crescer | MVP first, iterar depois |
| 4 | Performance em produção | Load tests antes do launch |
