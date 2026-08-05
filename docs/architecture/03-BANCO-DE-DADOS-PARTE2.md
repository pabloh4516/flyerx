# Flyerx - Modelagem do Banco de Dados (Parte 2)

## 4.3 Tabelas - Wallet Context

#### 4.3.1 `wallets`

**Finalidade**: Carteira digital de cada usuário. Cada usuário possui uma carteira em BRL.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `user_id` | UUID | NO | - | FK para users |
| `currency` | VARCHAR(3) | NO | 'BRL' | Moeda (ISO 4217) |
| `status` | VARCHAR(20) | NO | 'active' | Status: active, blocked, suspended |
| `blocked_reason` | TEXT | YES | NULL | Motivo do bloqueio |
| `blocked_at` | TIMESTAMP | YES | NULL | Data do bloqueio |
| `blocked_by` | UUID | YES | NULL | Quem bloqueou |
| `metadata` | JSONB | YES | '{}' | Metadados |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_wallets_user_currency (user_id, currency)`
- `INDEX idx_wallets_status (status)`

**Foreign Keys**:
- `FK wallets_user_id REFERENCES users(id) ON DELETE RESTRICT`
- `FK wallets_blocked_by REFERENCES users(id) ON DELETE SET NULL`

**Restrições**:
- `CHECK (status IN ('active', 'blocked', 'suspended'))`

**Motivação**: A wallet NÃO armazena saldo diretamente. O saldo é sempre calculado a partir do ledger. Isso garante consistência e auditabilidade total.

---

#### 4.3.2 `balance_reservations`

**Finalidade**: Reservas temporárias de saldo para operações em andamento (saques, transferências).

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `wallet_id` | UUID | NO | - | FK para wallets |
| `amount_cents` | BIGINT | NO | - | Valor reservado em centavos |
| `operation_type` | VARCHAR(30) | NO | - | Tipo: withdrawal, transfer |
| `operation_id` | UUID | NO | - | ID da operação relacionada |
| `status` | VARCHAR(20) | NO | 'active' | Status: active, released, consumed |
| `expires_at` | TIMESTAMP | NO | - | Expiração da reserva |
| `released_at` | TIMESTAMP | YES | NULL | Data de liberação |
| `consumed_at` | TIMESTAMP | YES | NULL | Data de consumo |
| `reason` | TEXT | YES | NULL | Motivo da reserva |
| `metadata` | JSONB | YES | '{}' | Metadados |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_balance_reservations_wallet_id (wallet_id)`
- `INDEX idx_balance_reservations_operation (operation_type, operation_id)`
- `INDEX idx_balance_reservations_status (status)`
- `INDEX idx_balance_reservations_expires_at (expires_at) WHERE status = 'active'`

**Foreign Keys**:
- `FK balance_reservations_wallet_id REFERENCES wallets(id) ON DELETE RESTRICT`

**Restrições**:
- `CHECK (amount_cents > 0)`
- `CHECK (status IN ('active', 'released', 'consumed'))`

**Motivação**: Reservas previnem double-spending durante operações assíncronas. Quando um saque é solicitado, o valor é reservado imediatamente, garantindo que o usuário não gaste o mesmo dinheiro duas vezes.

---

#### 4.3.3 `wallet_limits`

**Finalidade**: Limites operacionais por carteira (sobrescreve limites padrão).

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `wallet_id` | UUID | NO | - | FK para wallets |
| `operation_type` | VARCHAR(30) | NO | - | Tipo: deposit, withdrawal |
| `daily_limit_cents` | BIGINT | YES | NULL | Limite diário |
| `monthly_limit_cents` | BIGINT | YES | NULL | Limite mensal |
| `per_transaction_min_cents` | BIGINT | YES | NULL | Mínimo por transação |
| `per_transaction_max_cents` | BIGINT | YES | NULL | Máximo por transação |
| `is_custom` | BOOLEAN | NO | FALSE | É limite customizado |
| `set_by` | UUID | YES | NULL | Quem definiu |
| `reason` | TEXT | YES | NULL | Motivo |
| `effective_from` | TIMESTAMP | NO | NOW() | Início da vigência |
| `effective_until` | TIMESTAMP | YES | NULL | Fim da vigência |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_wallet_limits_wallet_operation (wallet_id, operation_type)`

**Foreign Keys**:
- `FK wallet_limits_wallet_id REFERENCES wallets(id) ON DELETE CASCADE`
- `FK wallet_limits_set_by REFERENCES users(id) ON DELETE SET NULL`

**Motivação**: Permite ajustar limites por usuário com base em KYC, histórico, ou necessidades específicas.

---

## 4.4 Tabelas - Payment Context

#### 4.4.1 `deposits`

**Finalidade**: Registro de depósitos via PIX.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `wallet_id` | UUID | NO | - | FK para wallets |
| `user_id` | UUID | NO | - | FK para users |
| `idempotency_key` | VARCHAR(100) | NO | - | Chave de idempotência |
| `amount_cents` | BIGINT | NO | - | Valor solicitado em centavos |
| `fee_cents` | BIGINT | NO | 0 | Taxa aplicada em centavos |
| `net_amount_cents` | BIGINT | NO | - | Valor líquido (amount - fee) |
| `currency` | VARCHAR(3) | NO | 'BRL' | Moeda |
| `status` | VARCHAR(30) | NO | 'pending' | Status do depósito |
| `pix_qr_code` | TEXT | YES | NULL | QR Code PIX (copia e cola) |
| `pix_qr_code_url` | TEXT | YES | NULL | URL da imagem do QR Code |
| `pix_key` | VARCHAR(100) | YES | NULL | Chave PIX usada |
| `payer_name` | VARCHAR(255) | YES | NULL | Nome do pagador |
| `payer_tax_number` | VARCHAR(14) | YES | NULL | CPF/CNPJ do pagador |
| `bank_tx_id` | VARCHAR(100) | YES | NULL | ID da transação bancária |
| `provider_id` | VARCHAR(100) | YES | NULL | ID no provider |
| `provider_name` | VARCHAR(50) | NO | - | Nome do provider (eulen) |
| `provider_status` | VARCHAR(50) | YES | NULL | Status no provider |
| `provider_response` | JSONB | YES | NULL | Response completo do provider |
| `ledger_transaction_id` | UUID | YES | NULL | FK para ledger_transactions |
| `fee_configuration_id` | UUID | YES | NULL | FK para fee_configurations |
| `confirmed_at` | TIMESTAMP | YES | NULL | Data de confirmação |
| `expires_at` | TIMESTAMP | YES | NULL | Expiração do QR Code |
| `failed_at` | TIMESTAMP | YES | NULL | Data de falha |
| `failure_reason` | TEXT | YES | NULL | Motivo da falha |
| `metadata` | JSONB | YES | '{}' | Metadados |
| `ip_address` | INET | YES | NULL | IP da solicitação |
| `device_id` | UUID | YES | NULL | Dispositivo usado |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_deposits_idempotency (idempotency_key)`
- `INDEX idx_deposits_wallet_id (wallet_id)`
- `INDEX idx_deposits_user_id (user_id)`
- `INDEX idx_deposits_status (status)`
- `INDEX idx_deposits_provider_id (provider_id)`
- `INDEX idx_deposits_created_at (created_at)`
- `INDEX idx_deposits_status_created (status, created_at)`

**Foreign Keys**:
- `FK deposits_wallet_id REFERENCES wallets(id) ON DELETE RESTRICT`
- `FK deposits_user_id REFERENCES users(id) ON DELETE RESTRICT`
- `FK deposits_ledger_transaction_id REFERENCES ledger_transactions(id)`
- `FK deposits_fee_configuration_id REFERENCES fee_configurations(id)`
- `FK deposits_device_id REFERENCES user_devices(id)`

**Restrições**:
- `CHECK (amount_cents > 0)`
- `CHECK (fee_cents >= 0)`
- `CHECK (net_amount_cents = amount_cents - fee_cents)`

**Status possíveis**:
- `pending` - Aguardando pagamento
- `processing` - Processando no provider
- `confirmed` - Confirmado e creditado
- `expired` - QR Code expirado
- `failed` - Falha no processamento
- `refunded` - Estornado

**Motivação**: Registro completo do ciclo de vida do depósito. O `idempotency_key` previne duplicação. O `provider_response` completo permite debugging.

---

#### 4.4.2 `deposit_status_logs`

**Finalidade**: Histórico de mudanças de status do depósito (auditoria).

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `deposit_id` | UUID | NO | - | FK para deposits |
| `previous_status` | VARCHAR(30) | YES | NULL | Status anterior |
| `new_status` | VARCHAR(30) | NO | - | Novo status |
| `provider_status` | VARCHAR(50) | YES | NULL | Status do provider |
| `reason` | TEXT | YES | NULL | Motivo da mudança |
| `metadata` | JSONB | YES | '{}' | Metadados |
| `created_at` | TIMESTAMP | NO | NOW() | Data da mudança |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_deposit_status_logs_deposit_id (deposit_id)`
- `INDEX idx_deposit_status_logs_created_at (created_at)`

**Foreign Keys**:
- `FK deposit_status_logs_deposit_id REFERENCES deposits(id) ON DELETE CASCADE`

**Motivação**: Auditoria completa de todas as transições de estado. Essencial para debugging e compliance.

---

#### 4.4.3 `withdrawals`

**Finalidade**: Registro de saques via PIX.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `wallet_id` | UUID | NO | - | FK para wallets |
| `user_id` | UUID | NO | - | FK para users |
| `idempotency_key` | VARCHAR(100) | NO | - | Chave de idempotência |
| `amount_cents` | BIGINT | NO | - | Valor bruto solicitado |
| `fee_cents` | BIGINT | NO | 0 | Taxa aplicada |
| `net_amount_cents` | BIGINT | NO | - | Valor líquido recebido |
| `currency` | VARCHAR(3) | NO | 'BRL' | Moeda |
| `status` | VARCHAR(30) | NO | 'pending' | Status do saque |
| `pix_key` | VARCHAR(100) | NO | - | Chave PIX destino |
| `pix_key_type` | VARCHAR(20) | NO | - | Tipo: cpf, cnpj, email, phone, random |
| `recipient_name` | VARCHAR(255) | YES | NULL | Nome do recebedor |
| `recipient_tax_number` | VARCHAR(14) | NO | - | CPF/CNPJ do recebedor |
| `recipient_bank_name` | VARCHAR(100) | YES | NULL | Banco do recebedor |
| `bank_tx_id` | VARCHAR(100) | YES | NULL | ID da transação bancária |
| `provider_id` | VARCHAR(100) | YES | NULL | ID no provider |
| `provider_name` | VARCHAR(50) | NO | - | Nome do provider |
| `provider_status` | VARCHAR(50) | YES | NULL | Status no provider |
| `provider_response` | JSONB | YES | NULL | Response do provider |
| `reservation_id` | UUID | YES | NULL | FK para balance_reservations |
| `ledger_transaction_id` | UUID | YES | NULL | FK para ledger_transactions |
| `fee_configuration_id` | UUID | YES | NULL | FK para fee_configurations |
| `confirmed_at` | TIMESTAMP | YES | NULL | Data de confirmação |
| `failed_at` | TIMESTAMP | YES | NULL | Data de falha |
| `failure_reason` | TEXT | YES | NULL | Motivo da falha |
| `refunded_at` | TIMESTAMP | YES | NULL | Data do estorno |
| `metadata` | JSONB | YES | '{}' | Metadados |
| `ip_address` | INET | YES | NULL | IP da solicitação |
| `device_id` | UUID | YES | NULL | Dispositivo usado |
| `requires_approval` | BOOLEAN | NO | FALSE | Requer aprovação manual |
| `approved_by` | UUID | YES | NULL | Quem aprovou |
| `approved_at` | TIMESTAMP | YES | NULL | Data de aprovação |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_withdrawals_idempotency (idempotency_key)`
- `INDEX idx_withdrawals_wallet_id (wallet_id)`
- `INDEX idx_withdrawals_user_id (user_id)`
- `INDEX idx_withdrawals_status (status)`
- `INDEX idx_withdrawals_provider_id (provider_id)`
- `INDEX idx_withdrawals_created_at (created_at)`
- `INDEX idx_withdrawals_requires_approval (requires_approval) WHERE requires_approval = TRUE`

**Foreign Keys**:
- `FK withdrawals_wallet_id REFERENCES wallets(id) ON DELETE RESTRICT`
- `FK withdrawals_user_id REFERENCES users(id) ON DELETE RESTRICT`
- `FK withdrawals_reservation_id REFERENCES balance_reservations(id)`
- `FK withdrawals_ledger_transaction_id REFERENCES ledger_transactions(id)`
- `FK withdrawals_approved_by REFERENCES users(id)`

**Status possíveis**:
- `pending` - Aguardando processamento
- `reserved` - Saldo reservado
- `pending_approval` - Aguardando aprovação manual
- `processing` - Processando no provider
- `confirmed` - Confirmado e enviado
- `failed` - Falha no processamento
- `refunded` - Saldo devolvido
- `cancelled` - Cancelado pelo usuário

**Motivação**: Saques têm fluxo mais complexo que depósitos. Requerem validação de saldo, reserva, possível aprovação manual, e tratamento de falhas com estorno automático.

---

#### 4.4.4 `withdrawal_status_logs`

**Finalidade**: Histórico de mudanças de status do saque.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `withdrawal_id` | UUID | NO | - | FK para withdrawals |
| `previous_status` | VARCHAR(30) | YES | NULL | Status anterior |
| `new_status` | VARCHAR(30) | NO | - | Novo status |
| `provider_status` | VARCHAR(50) | YES | NULL | Status do provider |
| `reason` | TEXT | YES | NULL | Motivo |
| `actor_id` | UUID | YES | NULL | Quem causou a mudança |
| `actor_type` | VARCHAR(20) | YES | NULL | Tipo: user, admin, system, provider |
| `metadata` | JSONB | YES | '{}' | Metadados |
| `created_at` | TIMESTAMP | NO | NOW() | Data da mudança |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_withdrawal_status_logs_withdrawal_id (withdrawal_id)`

**Foreign Keys**:
- `FK withdrawal_status_logs_withdrawal_id REFERENCES withdrawals(id) ON DELETE CASCADE`
