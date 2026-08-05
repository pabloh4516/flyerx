# Flyerx - Modelagem do Banco de Dados (Parte 3)

## 4.5 Tabelas - Ledger Context

#### 4.5.1 `ledger_accounts`

**Finalidade**: Contas contábeis do sistema (partidas dobradas).

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `code` | VARCHAR(20) | NO | - | Código da conta (ex: 1.1.001) |
| `name` | VARCHAR(100) | NO | - | Nome da conta |
| `type` | VARCHAR(20) | NO | - | Tipo: asset, liability, equity, revenue, expense |
| `category` | VARCHAR(50) | NO | - | Categoria: user_wallet, platform_fee, etc. |
| `parent_id` | UUID | YES | NULL | Conta pai (hierarquia) |
| `holder_type` | VARCHAR(50) | YES | NULL | Tipo do titular: user, platform |
| `holder_id` | UUID | YES | NULL | ID do titular |
| `currency` | VARCHAR(3) | NO | 'BRL' | Moeda |
| `is_system` | BOOLEAN | NO | FALSE | Conta do sistema |
| `is_active` | BOOLEAN | NO | TRUE | Conta ativa |
| `metadata` | JSONB | YES | '{}' | Metadados |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_ledger_accounts_code (code)`
- `INDEX idx_ledger_accounts_holder (holder_type, holder_id)`
- `INDEX idx_ledger_accounts_type (type)`
- `INDEX idx_ledger_accounts_category (category)`

**Restrições**:
- `CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense'))`

**Contas do Sistema (exemplos)**:
```
1.0.000 - ATIVOS
  1.1.000 - Ativos Circulantes
    1.1.001 - Caixa Eulen (conta de liquidação)
    1.1.100 - Carteiras de Usuários (grupo)
      1.1.100.{user_id} - Carteira do Usuário X

2.0.000 - PASSIVOS
  2.1.000 - Obrigações
    2.1.001 - Saldos de Usuários a Pagar

3.0.000 - RECEITAS
  3.1.000 - Receitas Operacionais
    3.1.001 - Taxas de Depósito
    3.1.002 - Taxas de Saque
```

**Motivação**: Estrutura de contas contábeis permite partidas dobradas (double-entry bookkeeping), garantindo que toda movimentação tenha débito e crédito iguais.

---

#### 4.5.2 `ledger_transactions`

**Finalidade**: Agrupa lançamentos relacionados (uma transação = múltiplos entries).

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `reference_type` | VARCHAR(50) | NO | - | Tipo: deposit, withdrawal, fee, adjustment |
| `reference_id` | UUID | NO | - | ID da operação relacionada |
| `description` | TEXT | NO | - | Descrição da transação |
| `total_amount_cents` | BIGINT | NO | - | Valor total da transação |
| `currency` | VARCHAR(3) | NO | 'BRL' | Moeda |
| `status` | VARCHAR(20) | NO | 'completed' | Status: pending, completed, reversed |
| `reversed_at` | TIMESTAMP | YES | NULL | Data de reversão |
| `reversed_by` | UUID | YES | NULL | Quem reverteu |
| `reversal_reason` | TEXT | YES | NULL | Motivo da reversão |
| `reversal_transaction_id` | UUID | YES | NULL | Transação de reversão |
| `metadata` | JSONB | YES | '{}' | Metadados |
| `created_by` | UUID | YES | NULL | Quem criou |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_ledger_transactions_reference (reference_type, reference_id)`
- `INDEX idx_ledger_transactions_created_at (created_at)`
- `INDEX idx_ledger_transactions_status (status)`

**Restrições**:
- `CHECK (status IN ('pending', 'completed', 'reversed'))`

**Motivação**: Agrupa lançamentos atômicos. Permite reverter uma transação completa mantendo histórico.

---

#### 4.5.3 `ledger_entries`

**Finalidade**: Lançamentos contábeis individuais (IMUTÁVEIS - nunca atualizar ou deletar).

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `transaction_id` | UUID | NO | - | FK para ledger_transactions |
| `account_id` | UUID | NO | - | FK para ledger_accounts |
| `entry_type` | VARCHAR(10) | NO | - | Tipo: debit, credit |
| `amount_cents` | BIGINT | NO | - | Valor em centavos (sempre positivo) |
| `balance_after_cents` | BIGINT | NO | - | Saldo após este lançamento |
| `description` | TEXT | YES | NULL | Descrição do lançamento |
| `sequence_number` | BIGINT | NO | - | Sequência global (imutável) |
| `metadata` | JSONB | YES | '{}' | Metadados |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_ledger_entries_transaction_id (transaction_id)`
- `INDEX idx_ledger_entries_account_id (account_id)`
- `INDEX idx_ledger_entries_account_created (account_id, created_at)`
- `UNIQUE INDEX idx_ledger_entries_sequence (sequence_number)`

**Foreign Keys**:
- `FK ledger_entries_transaction_id REFERENCES ledger_transactions(id)`
- `FK ledger_entries_account_id REFERENCES ledger_accounts(id)`

**Restrições**:
- `CHECK (entry_type IN ('debit', 'credit'))`
- `CHECK (amount_cents > 0)`

**REGRA CRÍTICA**: Esta tabela é APPEND-ONLY. Nunca UPDATE ou DELETE.

**Exemplo de Lançamento - Depósito de R$ 100,00 com taxa de R$ 1,00**:
```
Transaction: "Depósito PIX #abc123"
Entries:
  1. DEBIT  1.1.001 (Caixa Eulen)      R$ 100,00
  2. CREDIT 1.1.100.user_x (Carteira) R$  99,00
  3. CREDIT 3.1.001 (Receita Taxa)    R$   1,00
```

**Motivação**: Core do sistema financeiro. O saldo de qualquer conta é calculado somando débitos e subtraindo créditos. Imutabilidade garante auditabilidade total.

---

## 4.6 Tabelas - Fee Context

#### 4.6.1 `fee_configurations`

**Finalidade**: Configuração de taxas do sistema.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `name` | VARCHAR(100) | NO | - | Nome da configuração |
| `operation_type` | VARCHAR(30) | NO | - | Tipo: deposit, withdrawal |
| `fee_type` | VARCHAR(20) | NO | - | Tipo: fixed, percentage, mixed |
| `fixed_amount_cents` | BIGINT | YES | NULL | Valor fixo em centavos |
| `percentage` | DECIMAL(8,4) | YES | NULL | Percentual (ex: 2.5000 = 2.5%) |
| `min_fee_cents` | BIGINT | YES | NULL | Taxa mínima |
| `max_fee_cents` | BIGINT | YES | NULL | Taxa máxima |
| `min_transaction_cents` | BIGINT | YES | NULL | Transação mínima aplicável |
| `max_transaction_cents` | BIGINT | YES | NULL | Transação máxima aplicável |
| `applies_to` | VARCHAR(20) | NO | 'all' | Aplica a: all, kyc_level, user_tier |
| `applies_to_value` | VARCHAR(50) | YES | NULL | Valor do filtro |
| `priority` | INTEGER | NO | 0 | Prioridade (maior = preferência) |
| `is_active` | BOOLEAN | NO | TRUE | Configuração ativa |
| `starts_at` | TIMESTAMP | YES | NULL | Início da vigência |
| `ends_at` | TIMESTAMP | YES | NULL | Fim da vigência |
| `created_by` | UUID | YES | NULL | Quem criou |
| `metadata` | JSONB | YES | '{}' | Metadados |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_fee_configurations_operation (operation_type)`
- `INDEX idx_fee_configurations_active (is_active, operation_type)`
- `INDEX idx_fee_configurations_priority (operation_type, priority DESC)`

**Restrições**:
- `CHECK (fee_type IN ('fixed', 'percentage', 'mixed'))`
- `CHECK (applies_to IN ('all', 'kyc_level', 'user_tier', 'user_specific'))`

**Exemplos de Configuração**:
```
1. Taxa padrão de depósito: 2% (mín R$ 1, máx R$ 50)
2. Taxa KYC nível 3: 1.5% (sem mínimo)
3. Taxa promocional: 0% (vigência limitada)
4. Taxa de saque: R$ 3 fixo + 1%
```

**Motivação**: Sistema flexível de taxas permite ajustes sem deploy, promoções temporárias, e diferenciação por perfil de cliente.

---

#### 4.6.2 `fee_calculations`

**Finalidade**: Registro de cada cálculo de taxa (auditoria).

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `fee_configuration_id` | UUID | NO | - | FK para fee_configurations |
| `operation_type` | VARCHAR(30) | NO | - | Tipo de operação |
| `operation_id` | UUID | NO | - | ID da operação |
| `user_id` | UUID | NO | - | FK para users |
| `base_amount_cents` | BIGINT | NO | - | Valor base da operação |
| `calculated_fee_cents` | BIGINT | NO | - | Taxa calculada |
| `final_fee_cents` | BIGINT | NO | - | Taxa final (após min/max) |
| `calculation_details` | JSONB | NO | - | Detalhes do cálculo |
| `created_at` | TIMESTAMP | NO | NOW() | Data do cálculo |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_fee_calculations_operation (operation_type, operation_id)`
- `INDEX idx_fee_calculations_user (user_id)`

**Foreign Keys**:
- `FK fee_calculations_fee_configuration_id REFERENCES fee_configurations(id)`
- `FK fee_calculations_user_id REFERENCES users(id)`

**Motivação**: Rastreabilidade de como cada taxa foi calculada. Permite auditar e identificar problemas em regras.

---

## 4.7 Tabelas - Compliance/KYC Context

#### 4.7.1 `kyc_processes`

**Finalidade**: Processos de verificação KYC.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `user_id` | UUID | NO | - | FK para users |
| `requested_level` | SMALLINT | NO | - | Nível solicitado (1-3) |
| `current_level` | SMALLINT | NO | 0 | Nível atual |
| `status` | VARCHAR(20) | NO | 'pending' | Status do processo |
| `submitted_at` | TIMESTAMP | YES | NULL | Data de submissão |
| `reviewed_at` | TIMESTAMP | YES | NULL | Data de revisão |
| `reviewed_by` | UUID | YES | NULL | Quem revisou |
| `approved_at` | TIMESTAMP | YES | NULL | Data de aprovação |
| `rejected_at` | TIMESTAMP | YES | NULL | Data de rejeição |
| `rejection_reason` | TEXT | YES | NULL | Motivo da rejeição |
| `expires_at` | TIMESTAMP | YES | NULL | Expiração da verificação |
| `metadata` | JSONB | YES | '{}' | Metadados |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_kyc_processes_user_id (user_id)`
- `INDEX idx_kyc_processes_status (status)`

**Foreign Keys**:
- `FK kyc_processes_user_id REFERENCES users(id)`
- `FK kyc_processes_reviewed_by REFERENCES users(id)`

**Status possíveis**:
- `pending` - Aguardando documentos
- `submitted` - Documentos enviados
- `in_review` - Em análise
- `approved` - Aprovado
- `rejected` - Rejeitado
- `expired` - Expirado

---

#### 4.7.2 `kyc_documents`

**Finalidade**: Documentos enviados para KYC.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `kyc_process_id` | UUID | NO | - | FK para kyc_processes |
| `document_type` | VARCHAR(30) | NO | - | Tipo: id_front, id_back, selfie, proof_address |
| `file_path` | VARCHAR(500) | NO | - | Caminho do arquivo (criptografado) |
| `file_hash` | VARCHAR(64) | NO | - | Hash SHA256 do arquivo |
| `mime_type` | VARCHAR(50) | NO | - | Tipo MIME |
| `file_size_bytes` | INTEGER | NO | - | Tamanho em bytes |
| `status` | VARCHAR(20) | NO | 'pending' | Status: pending, approved, rejected |
| `rejection_reason` | TEXT | YES | NULL | Motivo da rejeição |
| `reviewed_by` | UUID | YES | NULL | Quem revisou |
| `reviewed_at` | TIMESTAMP | YES | NULL | Data de revisão |
| `metadata` | JSONB | YES | '{}' | Metadados |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_kyc_documents_process_id (kyc_process_id)`
- `INDEX idx_kyc_documents_type (document_type)`

**Foreign Keys**:
- `FK kyc_documents_kyc_process_id REFERENCES kyc_processes(id)`
- `FK kyc_documents_reviewed_by REFERENCES users(id)`

---

## 4.8 Tabelas - Audit Context

#### 4.8.1 `audit_logs`

**Finalidade**: Log de auditoria de todas as ações do sistema.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `actor_type` | VARCHAR(20) | NO | - | Tipo: user, admin, system, provider |
| `actor_id` | UUID | YES | NULL | ID do ator |
| `action` | VARCHAR(100) | NO | - | Ação realizada |
| `resource_type` | VARCHAR(50) | NO | - | Tipo do recurso |
| `resource_id` | UUID | YES | NULL | ID do recurso |
| `old_values` | JSONB | YES | NULL | Valores anteriores |
| `new_values` | JSONB | YES | NULL | Novos valores |
| `ip_address` | INET | YES | NULL | IP |
| `user_agent` | TEXT | YES | NULL | User agent |
| `request_id` | VARCHAR(100) | YES | NULL | ID da requisição |
| `metadata` | JSONB | YES | '{}' | Metadados |
| `created_at` | TIMESTAMP | NO | NOW() | Data da ação |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_audit_logs_actor (actor_type, actor_id)`
- `INDEX idx_audit_logs_resource (resource_type, resource_id)`
- `INDEX idx_audit_logs_action (action)`
- `INDEX idx_audit_logs_created_at (created_at)`

**Particionamento**: Por mês (created_at) para performance.

**Motivação**: Compliance e segurança. Permite rastrear todas as ações no sistema.

---

#### 4.8.2 `webhook_logs`

**Finalidade**: Log de webhooks recebidos dos providers.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `provider` | VARCHAR(50) | NO | - | Nome do provider |
| `event_type` | VARCHAR(50) | NO | - | Tipo do evento |
| `payload` | JSONB | NO | - | Payload recebido |
| `headers` | JSONB | YES | NULL | Headers recebidos |
| `signature` | VARCHAR(500) | YES | NULL | Assinatura recebida |
| `signature_valid` | BOOLEAN | YES | NULL | Assinatura válida |
| `processed` | BOOLEAN | NO | FALSE | Foi processado |
| `processed_at` | TIMESTAMP | YES | NULL | Data de processamento |
| `processing_result` | VARCHAR(20) | YES | NULL | Resultado: success, failed, ignored |
| `error_message` | TEXT | YES | NULL | Mensagem de erro |
| `related_type` | VARCHAR(50) | YES | NULL | Tipo relacionado |
| `related_id` | UUID | YES | NULL | ID relacionado |
| `ip_address` | INET | YES | NULL | IP de origem |
| `created_at` | TIMESTAMP | NO | NOW() | Data de recebimento |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_webhook_logs_provider (provider)`
- `INDEX idx_webhook_logs_event (event_type)`
- `INDEX idx_webhook_logs_processed (processed)`
- `INDEX idx_webhook_logs_related (related_type, related_id)`
- `INDEX idx_webhook_logs_created_at (created_at)`

**Motivação**: Debugging de integrações. Permite reprocessar webhooks e identificar problemas.
