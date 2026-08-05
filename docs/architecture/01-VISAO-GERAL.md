# Flyerx - Documento de Arquitetura

## 1. Visão Geral da Plataforma

### 1.1 Descrição
Flyerx é uma plataforma financeira digital completa que permite:
- Criação de contas e autenticação segura
- Carteira digital com saldo em tempo real
- Depósitos via PIX
- Saques via PIX
- Sistema de taxas configurável
- KYC (Know Your Customer)
- Painel administrativo completo
- Auditoria e rastreabilidade total

### 1.2 Princípios Arquiteturais

| Princípio | Descrição |
|-----------|-----------|
| **Desacoplamento** | Provider de pagamento isolado, substituível sem impacto no core |
| **Auditabilidade** | Todo movimento financeiro rastreável e imutável |
| **Consistência** | Saldos calculados via ledger, nunca modificados diretamente |
| **Segurança** | Defense in depth, múltiplas camadas de proteção |
| **Escalabilidade** | Arquitetura preparada para alto volume de transações |
| **Idempotência** | Operações financeiras seguras contra duplicação |

### 1.3 Stack Tecnológica

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  Mobile (Flutter)          │  Admin (Vue 3 + Inertia)           │
│  - Android                 │  - Dashboard                        │
│  - iOS                     │  - Gestão de usuários               │
│  - Web                     │  - Relatórios                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  PHP 8.4 + Laravel 12                                           │
│  ├── REST API (OpenAPI/Swagger)                                 │
│  ├── Queue System (Redis + Horizon)                             │
│  ├── Scheduler (Cron Jobs)                                      │
│  └── WebSockets (Notificações real-time)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PERSISTÊNCIA                                │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL                │  Redis                              │
│  - Dados transacionais     │  - Cache                            │
│  - Ledger                  │  - Sessions                         │
│  - Auditoria               │  - Queues                           │
│                            │  - Rate Limiting                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRAÇÕES EXTERNAS                          │
├─────────────────────────────────────────────────────────────────┤
│  Payment Provider Layer (Abstração)                              │
│  └── Eulen/DePix (Implementação atual)                          │
│      - Depósitos PIX                                             │
│      - Saques PIX                                                │
│      - Webhooks                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Justificativa: Vue 3 + Inertia vs Nuxt

**Decisão: Vue 3 + Inertia**

| Critério | Vue 3 + Inertia | Nuxt |
|----------|-----------------|------|
| Integração Laravel | Nativa, sem API separada | Requer API REST separada |
| Complexidade | Menor, monolito moderno | Maior, dois projetos |
| Autenticação | Usa session/sanctum nativo | JWT/API tokens |
| Deploy | Single deploy | Dois deploys |
| SEO | Não necessário (painel admin) | Overkill para admin |
| Curva aprendizado | Menor | Maior |

**Conclusão**: Para painel administrativo interno, Vue 3 + Inertia oferece melhor DX, menor complexidade e integração nativa com Laravel.

---

## 2. Bounded Contexts (DDD)

### 2.1 Mapa de Contextos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            FLYERX PLATFORM                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │   IDENTITY   │    │   WALLET     │    │   PAYMENT    │               │
│  │   CONTEXT    │───▶│   CONTEXT    │◀───│   CONTEXT    │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│         │                   │                   │                        │
│         │                   ▼                   │                        │
│         │            ┌──────────────┐           │                        │
│         │            │   LEDGER     │           │                        │
│         └───────────▶│   CONTEXT    │◀──────────┘                        │
│                      └──────────────┘                                    │
│                             │                                            │
│         ┌───────────────────┼───────────────────┐                        │
│         ▼                   ▼                   ▼                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │  COMPLIANCE  │    │    AUDIT     │    │ NOTIFICATION │               │
│  │   CONTEXT    │    │   CONTEXT    │    │   CONTEXT    │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │ INTEGRATION  │    │    ADMIN     │    │   CONFIG     │               │
│  │   CONTEXT    │    │   CONTEXT    │    │   CONTEXT    │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Descrição dos Contextos

#### IDENTITY CONTEXT
**Responsabilidade**: Gerenciamento de identidade, autenticação e autorização.

| Componente | Descrição |
|------------|-----------|
| User | Entidade principal do usuário |
| Authentication | Login, logout, refresh token |
| Authorization | Roles, permissions, policies |
| TwoFactorAuth | 2FA via TOTP |
| PasswordRecovery | Reset de senha seguro |
| DeviceManagement | Tracking de dispositivos |
| Session | Gerenciamento de sessões |

#### WALLET CONTEXT
**Responsabilidade**: Carteira digital e saldos do usuário.

| Componente | Descrição |
|------------|-----------|
| Wallet | Carteira do usuário |
| Balance | Saldos (disponível, reservado, bloqueado) |
| Statement | Extrato de movimentações |
| BalanceReservation | Reserva de saldo para operações |

#### PAYMENT CONTEXT
**Responsabilidade**: Orquestração de operações de pagamento.

| Componente | Descrição |
|------------|-----------|
| Deposit | Depósitos via PIX |
| Withdrawal | Saques via PIX |
| PixQrCode | Geração e gestão de QR Codes |
| PaymentStatus | Estados das transações |
| Fee | Cálculo e aplicação de taxas |

#### LEDGER CONTEXT
**Responsabilidade**: Registro imutável de todas as movimentações financeiras.

| Componente | Descrição |
|------------|-----------|
| Entry | Lançamento contábil |
| Transaction | Transação (agrupa entries) |
| Account | Conta contábil |
| DoubleEntry | Partidas dobradas |

#### COMPLIANCE CONTEXT
**Responsabilidade**: KYC, AML e conformidade regulatória.

| Componente | Descrição |
|------------|-----------|
| KycProcess | Processo de verificação |
| Document | Documentos enviados |
| RiskAssessment | Avaliação de risco |
| Sanctions | Verificação de sanções |

#### AUDIT CONTEXT
**Responsabilidade**: Rastreabilidade e logs de auditoria.

| Componente | Descrição |
|------------|-----------|
| AuditLog | Log de auditoria |
| ChangeTracker | Tracking de mudanças |
| EventStore | Armazenamento de eventos |

#### NOTIFICATION CONTEXT
**Responsabilidade**: Comunicação com usuários.

| Componente | Descrição |
|------------|-----------|
| Notification | Notificações |
| Channel | Canais (push, email, sms) |
| Template | Templates de mensagens |

#### INTEGRATION CONTEXT
**Responsabilidade**: Integrações com sistemas externos.

| Componente | Descrição |
|------------|-----------|
| PaymentProvider | Abstração de provedores |
| EulenProvider | Implementação Eulen |
| WebhookHandler | Processamento de webhooks |
| CircuitBreaker | Resiliência |

#### ADMIN CONTEXT
**Responsabilidade**: Operações administrativas.

| Componente | Descrição |
|------------|-----------|
| Dashboard | Métricas e KPIs |
| UserManagement | Gestão de usuários |
| Reports | Relatórios |
| Operations | Operações manuais |

#### CONFIG CONTEXT
**Responsabilidade**: Configurações da plataforma.

| Componente | Descrição |
|------------|-----------|
| FeeConfig | Configuração de taxas |
| LimitConfig | Limites operacionais |
| FeatureFlag | Feature flags |
| SystemConfig | Configurações do sistema |
