# Flyerx - Modelagem do Banco de Dados (Parte 4)

## 4.9 Tabelas - Notification Context

#### 4.9.1 `notifications`

**Finalidade**: Notificações enviadas aos usuários.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `user_id` | UUID | NO | - | FK para users |
| `type` | VARCHAR(50) | NO | - | Tipo da notificação |
| `channel` | VARCHAR(20) | NO | - | Canal: push, email, sms, in_app |
| `title` | VARCHAR(255) | NO | - | Título |
| `body` | TEXT | NO | - | Corpo da mensagem |
| `data` | JSONB | YES | '{}' | Dados adicionais |
| `related_type` | VARCHAR(50) | YES | NULL | Tipo relacionado |
| `related_id` | UUID | YES | NULL | ID relacionado |
| `sent_at` | TIMESTAMP | YES | NULL | Data de envio |
| `delivered_at` | TIMESTAMP | YES | NULL | Data de entrega |
| `read_at` | TIMESTAMP | YES | NULL | Data de leitura |
| `failed_at` | TIMESTAMP | YES | NULL | Data de falha |
| `failure_reason` | TEXT | YES | NULL | Motivo da falha |
| `retry_count` | INTEGER | NO | 0 | Tentativas |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_notifications_user_id (user_id)`
- `INDEX idx_notifications_type (type)`
- `INDEX idx_notifications_channel (channel)`
- `INDEX idx_notifications_unread (user_id, read_at) WHERE read_at IS NULL`
- `INDEX idx_notifications_created_at (created_at)`

**Foreign Keys**:
- `FK notifications_user_id REFERENCES users(id) ON DELETE CASCADE`

---

#### 4.9.2 `notification_preferences`

**Finalidade**: Preferências de notificação do usuário.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `user_id` | UUID | NO | - | FK para users |
| `notification_type` | VARCHAR(50) | NO | - | Tipo de notificação |
| `push_enabled` | BOOLEAN | NO | TRUE | Push habilitado |
| `email_enabled` | BOOLEAN | NO | TRUE | Email habilitado |
| `sms_enabled` | BOOLEAN | NO | FALSE | SMS habilitado |
| `in_app_enabled` | BOOLEAN | NO | TRUE | In-app habilitado |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_notification_prefs_user_type (user_id, notification_type)`

**Foreign Keys**:
- `FK notification_preferences_user_id REFERENCES users(id) ON DELETE CASCADE`

---

## 4.10 Tabelas - Configuration Context

#### 4.10.1 `system_configurations`

**Finalidade**: Configurações globais do sistema.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `key` | VARCHAR(100) | NO | - | Chave da configuração |
| `value` | JSONB | NO | - | Valor |
| `type` | VARCHAR(20) | NO | - | Tipo: string, number, boolean, json |
| `description` | TEXT | YES | NULL | Descrição |
| `is_sensitive` | BOOLEAN | NO | FALSE | É sensível (ocultar em logs) |
| `is_readonly` | BOOLEAN | NO | FALSE | Somente leitura |
| `updated_by` | UUID | YES | NULL | Quem atualizou |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_system_configurations_key (key)`

**Exemplos de Configurações**:
```json
{
  "deposit.min_amount_cents": 100,
  "deposit.max_amount_cents": 10000000,
  "withdrawal.min_amount_cents": 500,
  "withdrawal.max_amount_cents": 5000000,
  "withdrawal.requires_approval_above_cents": 1000000,
  "kyc.level_1_daily_limit_cents": 100000,
  "kyc.level_2_daily_limit_cents": 500000,
  "kyc.level_3_daily_limit_cents": 5000000,
  "security.max_login_attempts": 5,
  "security.lockout_duration_minutes": 30
}
```

---

#### 4.10.2 `operation_limits`

**Finalidade**: Limites operacionais por nível de KYC.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `kyc_level` | SMALLINT | NO | - | Nível de KYC (0-3) |
| `operation_type` | VARCHAR(30) | NO | - | Tipo: deposit, withdrawal |
| `daily_limit_cents` | BIGINT | NO | - | Limite diário |
| `monthly_limit_cents` | BIGINT | NO | - | Limite mensal |
| `per_transaction_min_cents` | BIGINT | NO | - | Mínimo por transação |
| `per_transaction_max_cents` | BIGINT | NO | - | Máximo por transação |
| `is_active` | BOOLEAN | NO | TRUE | Limite ativo |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_operation_limits_kyc_op (kyc_level, operation_type)`

**Exemplos de Limites**:
```
KYC 0: Depósito máx R$ 500/dia, Saque não permitido
KYC 1: Depósito máx R$ 5.000/dia, Saque máx R$ 2.000/dia
KYC 2: Depósito máx R$ 50.000/dia, Saque máx R$ 20.000/dia
KYC 3: Depósito máx R$ 500.000/dia, Saque máx R$ 200.000/dia
```

---

## 4.11 Tabelas - Integration Context

#### 4.11.1 `provider_configurations`

**Finalidade**: Configurações de provedores de pagamento.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `provider_name` | VARCHAR(50) | NO | - | Nome do provider |
| `is_active` | BOOLEAN | NO | TRUE | Provider ativo |
| `is_default` | BOOLEAN | NO | FALSE | Provider padrão |
| `supports_deposit` | BOOLEAN | NO | TRUE | Suporta depósito |
| `supports_withdrawal` | BOOLEAN | NO | TRUE | Suporta saque |
| `api_base_url` | VARCHAR(255) | NO | - | URL base da API |
| `api_version` | VARCHAR(20) | YES | NULL | Versão da API |
| `credentials_encrypted` | TEXT | NO | - | Credenciais criptografadas |
| `webhook_secret_encrypted` | TEXT | YES | NULL | Secret do webhook |
| `timeout_seconds` | INTEGER | NO | 30 | Timeout |
| `retry_attempts` | INTEGER | NO | 3 | Tentativas de retry |
| `circuit_breaker_threshold` | INTEGER | NO | 5 | Threshold do circuit breaker |
| `settings` | JSONB | YES | '{}' | Configurações adicionais |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_provider_configurations_name (provider_name)`
- `INDEX idx_provider_configurations_active (is_active)`

---

#### 4.11.2 `provider_health_checks`

**Finalidade**: Monitoramento de saúde dos providers.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `provider_name` | VARCHAR(50) | NO | - | Nome do provider |
| `status` | VARCHAR(20) | NO | - | Status: healthy, degraded, down |
| `response_time_ms` | INTEGER | YES | NULL | Tempo de resposta |
| `error_message` | TEXT | YES | NULL | Mensagem de erro |
| `checked_at` | TIMESTAMP | NO | NOW() | Data da verificação |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_provider_health_provider (provider_name)`
- `INDEX idx_provider_health_checked (checked_at)`

---

## 4.12 Views Materializadas

#### 4.12.1 `mv_wallet_balances`

**Finalidade**: Cache de saldos calculados a partir do ledger.

```sql
CREATE MATERIALIZED VIEW mv_wallet_balances AS
SELECT
    la.holder_id as wallet_id,
    la.currency,
    SUM(CASE WHEN le.entry_type = 'credit' THEN le.amount_cents ELSE 0 END) -
    SUM(CASE WHEN le.entry_type = 'debit' THEN le.amount_cents ELSE 0 END) as available_balance_cents,
    COALESCE(br.reserved_cents, 0) as reserved_balance_cents,
    (
        SUM(CASE WHEN le.entry_type = 'credit' THEN le.amount_cents ELSE 0 END) -
        SUM(CASE WHEN le.entry_type = 'debit' THEN le.amount_cents ELSE 0 END) -
        COALESCE(br.reserved_cents, 0)
    ) as usable_balance_cents,
    MAX(le.created_at) as last_movement_at
FROM ledger_accounts la
JOIN ledger_entries le ON le.account_id = la.id
LEFT JOIN (
    SELECT wallet_id, SUM(amount_cents) as reserved_cents
    FROM balance_reservations
    WHERE status = 'active'
    GROUP BY wallet_id
) br ON br.wallet_id = la.holder_id
WHERE la.holder_type = 'user'
  AND la.category = 'user_wallet'
GROUP BY la.holder_id, la.currency, br.reserved_cents;

CREATE UNIQUE INDEX idx_mv_wallet_balances_wallet ON mv_wallet_balances(wallet_id);
```

**Refresh**: A cada transação do ledger via trigger, ou schedule a cada 1 minuto.

---

#### 4.12.2 `mv_daily_statistics`

**Finalidade**: Estatísticas diárias para dashboard.

```sql
CREATE MATERIALIZED VIEW mv_daily_statistics AS
SELECT
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE status = 'confirmed') as total_deposits,
    SUM(amount_cents) FILTER (WHERE status = 'confirmed') as total_deposit_volume_cents,
    SUM(fee_cents) FILTER (WHERE status = 'confirmed') as total_deposit_fees_cents,
    'deposit' as operation_type
FROM deposits
GROUP BY DATE(created_at)
UNION ALL
SELECT
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE status = 'confirmed') as total_withdrawals,
    SUM(amount_cents) FILTER (WHERE status = 'confirmed') as total_withdrawal_volume_cents,
    SUM(fee_cents) FILTER (WHERE status = 'confirmed') as total_withdrawal_fees_cents,
    'withdrawal' as operation_type
FROM withdrawals
GROUP BY DATE(created_at);
```

---

## 4.13 Índices Compostos Importantes

```sql
-- Performance de consultas de extrato
CREATE INDEX idx_ledger_entries_statement
ON ledger_entries (account_id, created_at DESC);

-- Busca de depósitos pendentes para polling
CREATE INDEX idx_deposits_pending_polling
ON deposits (provider_name, status, created_at)
WHERE status IN ('pending', 'processing');

-- Busca de saques pendentes para polling
CREATE INDEX idx_withdrawals_pending_polling
ON withdrawals (provider_name, status, created_at)
WHERE status IN ('pending', 'reserved', 'processing');

-- Busca de reservas expiradas
CREATE INDEX idx_balance_reservations_expired
ON balance_reservations (expires_at)
WHERE status = 'active';

-- Performance de dashboard
CREATE INDEX idx_deposits_dashboard
ON deposits (created_at, status)
INCLUDE (amount_cents, fee_cents);

CREATE INDEX idx_withdrawals_dashboard
ON withdrawals (created_at, status)
INCLUDE (amount_cents, fee_cents);
```

---

## 4.14 Particionamento de Tabelas

### Tabelas a particionar por data:

```sql
-- audit_logs: particionado por mês
CREATE TABLE audit_logs (
    id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL,
    -- outros campos...
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- ledger_entries: particionado por mês
CREATE TABLE ledger_entries (
    id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL,
    -- outros campos...
) PARTITION BY RANGE (created_at);

-- webhook_logs: particionado por mês
CREATE TABLE webhook_logs (
    id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL,
    -- outros campos...
) PARTITION BY RANGE (created_at);
```

**Motivação**: Tabelas de alto volume se beneficiam de particionamento para:
- Performance de queries (partition pruning)
- Facilidade de manutenção (drop partitions antigas)
- Backups incrementais por partição

---

## 4.15 Resumo das Tabelas

| Contexto | Tabela | Finalidade |
|----------|--------|------------|
| Identity | users | Dados de usuários |
| Identity | user_devices | Dispositivos dos usuários |
| Identity | user_sessions | Sessões ativas |
| Identity | user_two_factor | Configurações 2FA |
| Identity | password_resets | Tokens de reset |
| Identity | roles | Papéis do sistema |
| Identity | permissions | Permissões granulares |
| Identity | role_permissions | N:N roles/permissions |
| Identity | user_roles | N:N users/roles |
| Wallet | wallets | Carteiras digitais |
| Wallet | balance_reservations | Reservas de saldo |
| Wallet | wallet_limits | Limites customizados |
| Payment | deposits | Depósitos PIX |
| Payment | deposit_status_logs | Histórico de status depósitos |
| Payment | withdrawals | Saques PIX |
| Payment | withdrawal_status_logs | Histórico de status saques |
| Ledger | ledger_accounts | Contas contábeis |
| Ledger | ledger_transactions | Transações agrupadas |
| Ledger | ledger_entries | Lançamentos (imutável) |
| Fee | fee_configurations | Configurações de taxas |
| Fee | fee_calculations | Histórico de cálculos |
| Compliance | kyc_processes | Processos KYC |
| Compliance | kyc_documents | Documentos KYC |
| Audit | audit_logs | Logs de auditoria |
| Audit | webhook_logs | Logs de webhooks |
| Notification | notifications | Notificações |
| Notification | notification_preferences | Preferências |
| Config | system_configurations | Configurações globais |
| Config | operation_limits | Limites por KYC |
| Integration | provider_configurations | Config de providers |
| Integration | provider_health_checks | Health checks |
