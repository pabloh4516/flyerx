# Catálogo da API Laravel (api/)

**Gerado em:** 2026-08-06
**Fonte:** Código em `api/` (DDD/Clean Architecture)
**Status:** Fonte de verdade oficial

---

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| Total de rotas HTTP | 24 |
| Rotas públicas | 8 |
| Rotas autenticadas | 15 |
| Rotas webhook | 1 |
| Controllers | 7 |
| Domínios | 6 (Auth, 2FA, Wallet, Deposits, Withdrawals, Webhooks) |

---

## 1. Rotas por Domínio

### 1.1 Health Check

| Método | Path | Auth | Propósito |
|--------|------|------|-----------|
| GET | `/health` | Não | Health check (status + timestamp) |

### 1.2 Autenticação (Auth)

#### Rotas Públicas

| Método | Path | Throttle | Propósito |
|--------|------|----------|-----------|
| POST | `/v1/auth/register` | 5/min | Registro de usuário |
| POST | `/v1/auth/login` | auth | Login com email/password |
| POST | `/v1/auth/2fa/verify` | auth | Verifica código 2FA no login |
| POST | `/v1/auth/refresh` | 10/min | Renova access token |
| POST | `/v1/auth/password/forgot` | 3/60min | Solicita reset de senha |
| POST | `/v1/auth/password/validate-token` | 10/min | Valida token de reset |
| POST | `/v1/auth/password/reset` | 3/60min | Executa reset de senha |
| GET | `/v1/email/verify/{id}/{token}` | 6/min | Verifica email (signed URL) |

#### Rotas Autenticadas

| Método | Path | Propósito |
|--------|------|-----------|
| GET | `/v1/auth/me` | Retorna dados do usuário autenticado |
| POST | `/v1/auth/logout` | Logout da sessão atual |
| POST | `/v1/auth/logout-all` | Logout de todas as sessões |
| POST | `/v1/auth/email/resend` | Reenvia email de verificação |

### 1.3 Two-Factor Authentication (2FA)

| Método | Path | Auth | Propósito |
|--------|------|------|-----------|
| GET | `/v1/2fa/status` | Sim | Status do 2FA |
| POST | `/v1/2fa/setup` | Sim | Inicia setup (gera QR code) |
| POST | `/v1/2fa/confirm` | Sim | Confirma setup com código |
| POST | `/v1/2fa/disable` | Sim | Desativa 2FA |
| POST | `/v1/2fa/backup-codes/regenerate` | Sim | Regenera backup codes |

### 1.4 Wallet (Carteira)

| Método | Path | Auth | Propósito |
|--------|------|------|-----------|
| GET | `/v1/wallet/` | Sim | Dados da carteira (saldo, limites) |
| GET | `/v1/wallet/balance` | Sim | Apenas saldo atual |
| GET | `/v1/wallet/history` | Sim | Histórico de transações |

### 1.5 Deposits (Depósitos PIX)

| Método | Path | Auth | Throttle | Propósito |
|--------|------|------|----------|-----------|
| POST | `/v1/deposits/` | Sim | 10/min | Cria depósito (QR Code) |
| GET | `/v1/deposits/pending` | Sim | - | Lista depósitos pendentes |
| GET | `/v1/deposits/{id}` | Sim | - | Detalhes de depósito |
| POST | `/v1/deposits/{id}/cancel` | Sim | - | Cancela depósito pendente |

### 1.6 Withdrawals (Saques PIX)

| Método | Path | Auth | Throttle | Propósito |
|--------|------|------|----------|-----------|
| POST | `/v1/withdrawals/` | Sim | 5/min | Cria saque |
| GET | `/v1/withdrawals/pending` | Sim | - | Lista saques pendentes |
| POST | `/v1/withdrawals/estimate-fee` | Sim | - | Estima taxa de saque |
| GET | `/v1/withdrawals/{id}` | Sim | - | Detalhes de saque |
| POST | `/v1/withdrawals/{id}/cancel` | Sim | - | Cancela saque pendente |

### 1.7 Webhooks

| Método | Path | Auth | Throttle | Propósito |
|--------|------|------|----------|-----------|
| POST | `/webhooks/eulen/` | Assinatura | 100/min | Recebe webhooks do Eulen |

---

## 2. Contratos Principais

### 2.1 POST /v1/auth/register

**Request:**
```json
{
  "email": "string (required, valid email)",
  "password": "string (required, min:8, mixed case + numbers + symbols)",
  "password_confirmation": "string (required)",
  "full_name": "string (required, min:3)",
  "tax_number": "string (required, CPF ou CNPJ)",
  "phone": "string (optional, +55 format)",
  "birth_date": "date (optional)",
  "accept_terms": "boolean (required, must be true)"
}
```

**Response 201:**
```json
{
  "message": "string",
  "user": { /* UserResource */ }
}
```

### 2.2 POST /v1/auth/login

**Request:**
```json
{
  "email": "string (required)",
  "password": "string (required)",
  "device_fingerprint": "string (optional)",
  "device_name": "string (optional)",
  "device_platform": "ios|android|web (optional)"
}
```

**Response 200 (sem 2FA):**
```json
{
  "access_token": "string (JWT)",
  "refresh_token": "string (JWT)",
  "expires_in": "integer (seconds)",
  "token_type": "Bearer",
  "user": { /* UserResource */ }
}
```

**Response 200 (com 2FA):**
```json
{
  "requires_two_factor": true,
  "two_factor_token": "string",
  "message": "Verificação de dois fatores necessária."
}
```

### 2.3 POST /v1/deposits

**Request:**
```json
{
  "amount": "number (required, min: 10, max: 50000)"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "wallet_id": "uuid",
    "status": "pending|awaiting_payment|processing|completed|failed|expired|cancelled",
    "amount": "number",
    "fee_amount": "number",
    "net_amount": "number",
    "currency": "BRL",
    "pix": {
      "qr_code": "string (base64)",
      "copy_paste": "string",
      "tx_id": "string"
    },
    "expires_at": "ISO8601",
    "created_at": "ISO8601"
  }
}
```

### 2.4 POST /v1/withdrawals

**Request:**
```json
{
  "amount": "number (required, min: 10, max: 10000)",
  "pix_key_type": "cpf|cnpj|email|phone|random",
  "pix_key": "string (required)",
  "recipient_name": "string (optional)",
  "recipient_document": "string (optional)"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "wallet_id": "uuid",
    "status": "pending|approved|processing|completed|failed|cancelled|rejected",
    "amount": "number",
    "fee_amount": "number",
    "net_amount": "number",
    "currency": "BRL",
    "pix": {
      "key_type": "string",
      "key": "string (masked)",
      "recipient_name": "string"
    },
    "end_to_end_id": "string (nullable)",
    "created_at": "ISO8601"
  }
}
```

---

## 3. Modelos e Estados

### 3.1 User

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| email | String | E-mail verificado |
| full_name | String | Nome completo |
| tax_number | String | CPF ou CNPJ |
| phone | String | Telefone (opcional) |
| status | Enum | Estado do usuário |
| kyc_level | Integer | Nível de KYC (0-3) |
| two_factor_enabled | Boolean | 2FA ativo |

**UserStatus:**
| Status | Pode logar? | Pode transacionar? |
|--------|-------------|-------------------|
| `pending` | Não | Não |
| `active` | Sim | Sim |
| `suspended` | Não | Não |
| `blocked` | Não | Não |

### 3.2 Wallet

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | FK para User |
| currency | String | BRL |
| status | Enum | Estado da carteira |
| daily_withdrawal_limit | Money | Limite diário de saque |
| monthly_withdrawal_limit | Money | Limite mensal de saque |

**WalletStatus:**
| Status | Descrição |
|--------|-----------|
| `active` | Operacional |
| `suspended` | Suspensa (compliance) |
| `closed` | Fechada |

### 3.3 Deposit

**DepositStatus:**
| Status | Descrição | Terminal? |
|--------|-----------|-----------|
| `pending` | Criado, aguardando | Não |
| `awaiting_payment` | QR gerado, aguardando PIX | Não |
| `processing` | Processando | Não |
| `completed` | Concluído | Sim |
| `failed` | Falhou | Sim |
| `expired` | Expirou | Sim |
| `cancelled` | Cancelado | Sim |

### 3.4 Withdrawal

**WithdrawalStatus:**
| Status | Descrição | Terminal? |
|--------|-----------|-----------|
| `pending` | Aguardando aprovação | Não |
| `approved` | Aprovado | Não |
| `processing` | Sendo enviado | Não |
| `completed` | Concluído | Sim |
| `failed` | Falhou | Sim |
| `cancelled` | Cancelado | Sim |
| `rejected` | Rejeitado | Sim |

### 3.5 PixKeyType

| Tipo | Validação | Exemplo |
|------|-----------|---------|
| `cpf` | 11 dígitos | 12345678901 |
| `cnpj` | 14 dígitos | 12345678901234 |
| `email` | RFC 5322 | usuario@email.com |
| `phone` | +55 + 10-14 dígitos | +5511987654321 |
| `random` | UUID v4 | a1b2c3d4-... |

### 3.6 LedgerEntry

**EntryType:**
| Tipo | Descrição |
|------|-----------|
| `debit` | Débito (reduz ativo) |
| `credit` | Crédito (aumenta ativo) |

**TransactionType:**
| Tipo | isCredit | isDebit |
|------|----------|---------|
| `deposit` | Sim | Não |
| `withdrawal` | Não | Sim |
| `transfer_in` | Sim | Não |
| `transfer_out` | Não | Sim |
| `fee` | Não | Sim |
| `refund` | Sim | Não |
| `adjustment` | Ambos | Ambos |

---

## 4. Regras de Negócio Exibíveis

### 4.1 Limites

| Operação | Mínimo | Máximo | Configurável |
|----------|--------|--------|--------------|
| Depósito | R$ 10,00 | R$ 50.000,00 | Sim |
| Saque | R$ 10,00 | R$ 10.000,00 | Sim |
| Saque diário | - | R$ 5.000,00 | Por usuário |
| Saque mensal | - | R$ 50.000,00 | Por usuário |

### 4.2 Taxas

| Operação | Fórmula | Mínimo |
|----------|---------|--------|
| Depósito | 0% (gratuito) | - |
| Saque | Configurável (ex: 1.5% + R$ 0) | R$ 1,00 |

### 4.3 Prazos

| Operação | TTL |
|----------|-----|
| QR Code PIX (depósito) | 30 minutos |
| Access Token JWT | 15 minutos |
| Refresh Token | 7 dias |
| Reserva de saldo (saque) | 24 horas |

---

## 5. Integração Eulen

### 5.1 Endpoints Chamados

| Operação | Método | Endpoint Eulen |
|----------|--------|----------------|
| Criar QR Code | POST | `/deposit` |
| Status depósito | GET | `/deposit-status?id={id}` |
| Criar PIX | POST | `/withdraw` |
| Status saque | GET | `/withdraw-status?id={id}` |

### 5.2 Mapeamento de Status

**Depósito (Eulen → Interno):**
| Eulen | Interno |
|-------|---------|
| `pending`, `waiting` | `awaiting_payment` |
| `processing`, `in_progress` | `processing` |
| `paid`, `completed`, `confirmed` | `completed` |
| `expired`, `timeout` | `expired` |
| `failed`, `error`, `cancelled` | `failed` |

**Saque (Eulen → Interno):**
| Eulen | Interno |
|-------|---------|
| `pending`, `waiting` | `pending` |
| `processing`, `sending` | `processing` |
| `sent`, `completed` | `completed` |
| `failed`, `error` | `failed` |
| `cancelled` | `cancelled` |
| `refunded` | `refunded` |

### 5.3 Webhooks Recebidos

| Evento | Ação |
|--------|------|
| `pix.deposit.confirmed` | Confirma depósito, credita carteira |
| `pix.deposit.expired` | Marca depósito como expirado |
| `pix.deposit.failed` | Marca depósito como falho |
| `pix.withdrawal.completed` | Confirma saque |
| `pix.withdrawal.failed` | Marca saque como falho, libera reserva |

### 5.4 Campos Armazenados do Provider

| Campo | Descrição |
|-------|-----------|
| `provider_id` | ID único no Eulen |
| `provider_status` | Status bruto do Eulen |
| `provider_response` | Resposta JSON completa |
| `pix_tx_id` | ID de transação PIX |
| `end_to_end_id` | E2E ID (saques) |

---

## 6. Console Commands

| Comando | Frequência | Propósito |
|---------|-----------|-----------|
| `flyerx:sync-deposits` | 5 min | Sincroniza depósitos pendentes |
| `flyerx:sync-withdrawals` | 5 min | Sincroniza saques pendentes |
| `flyerx:expire-reservations` | 1 min | Expira reservas de saldo |
| `flyerx:reconcile` | Diário 03:00 | Reconciliação contábil |
| `sanctum:prune-expired` | Diário 04:00 | Limpa tokens expirados |
| `flyerx:cleanup-audit-logs` | Semanal | Remove logs antigos (>365 dias) |

---

## Lacunas Identificadas

> **NOTA:** Estes são REGISTROS para decisão futura, não tarefas.

| # | Lacuna | Impacto | Observação |
|---|--------|---------|------------|
| 1 | Endpoints de Chaves PIX não expostos | Baixo | Chave PIX só para saques, não cadastrada |
| 2 | Links de Pagamento não implementados | Médio | Telas existem no frontend, backend não tem |
| 3 | Subcontas não implementadas | Médio | Telas existem no frontend, backend não tem |
| 4 | API Keys de desenvolvedor não implementadas | Baixo | Telas existem no frontend, backend não tem |
| 5 | Webhooks de saída não implementados | Baixo | Sistema interno não notifica externos |

---

*Documento gerado a partir do código em `api/app/` — é a fonte de verdade oficial.*
