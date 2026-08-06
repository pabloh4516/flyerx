# Catálogo do Microserviço LWK (flyerx-backend/)

**Gerado em:** 2026-08-06
**Fonte:** Código em `flyerx-backend/` (Python/FastAPI)
**Status:** Fonte de verdade oficial

---

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| Total de endpoints | 9 |
| Endpoints públicos | 2 (/health, /estimate-fee) |
| Endpoints autenticados | 7 (X-API-Key) |
| Estados de saque | 10 |
| Stack | Python 3.11+, FastAPI, SQLAlchemy, LWK |

---

## 1. Visão Geral

O microserviço `flyerx-backend` processa **saques DePix → PIX** utilizando o Liquid Wallet Kit (LWK). Funciona como intermediário entre o Laravel e a API Eulen.

```
┌──────────┐     ┌────────────────┐     ┌──────────┐
│  Laravel │────▶│ flyerx-backend │────▶│  Eulen   │
│  (api/)  │     │    (Python)    │     │  (PIX)   │
└──────────┘     └────────────────┘     └──────────┘
      │                  │
      │                  ▼
      │          ┌────────────────┐
      │          │   LWK (Liquid) │
      │          │   Blockchain   │
      │          └────────────────┘
```

---

## 2. Endpoints

### 2.1 Health & Status

| Método | Path | Auth | Propósito |
|--------|------|------|-----------|
| GET | `/health` | Não | Health check completo |
| GET | `/` | Não | Informações da API |

### 2.2 Saques

| Método | Path | Auth | Propósito |
|--------|------|------|-----------|
| POST | `/internal/withdrawals` | X-API-Key | Cria novo saque |
| GET | `/internal/withdrawals/{id}` | X-API-Key | Detalhes completos |
| GET | `/internal/withdrawals/{id}/status` | X-API-Key | Status otimizado (polling) |
| GET | `/internal/withdrawals` | X-API-Key | Lista saques do usuário |
| POST | `/internal/withdrawals/{id}/cancel` | X-API-Key | Cancela saque pendente |

### 2.3 Estimativa e Limites

| Método | Path | Auth | Propósito |
|--------|------|------|-----------|
| POST | `/internal/estimate-fee` | Não | Calcula taxas estimadas |
| GET | `/internal/limit/{tax_number}` | X-API-Key | Consulta limite diário |

### 2.4 Admin

| Método | Path | Auth | Propósito |
|--------|------|------|-----------|
| GET | `/internal/admin/pending` | X-API-Key | Lista pendentes |
| GET | `/internal/admin/by-address/{addr}` | X-API-Key | Busca por endereço Liquid |

---

## 3. Contratos

### 3.1 POST /internal/withdrawals

**Request:**
```json
{
  "user_id": "uuid",
  "pix_key": "chave_pix",
  "pix_key_type": "CPF|CNPJ|EMAIL|PHONE|RANDOM",
  "beneficiary_tax_number": "11 ou 14 dígitos",
  "amount_cents": 100000
}
```

**Validações:**
- `amount_cents`: 1 a 600.000 (R$ 6.000,00)
- `beneficiary_tax_number`: Checksum válido
- `pix_key_type`: Tipo PIX padrão

**Response 200:**
```json
{
  "id": "withdrawal-uuid",
  "status": "pending",
  "flyerx_address": "lq1qq...",
  "breakdown": {
    "requested_amount": 1000.00,
    "partner_fee": 15.00,
    "eulen_fee": 10.00,
    "total_fee": 25.00,
    "total_depix": 1025.00
  },
  "pix_key": "chave_pix",
  "pix_key_type": "CPF",
  "beneficiary_tax_number": "123***456-78",
  "eulen_withdrawal_id": "eulen-uuid",
  "created_at": "ISO8601",
  "expires_at": "ISO8601"
}
```

### 3.2 GET /internal/withdrawals/{id}/status

**Otimizado para polling frequente.**

**Response 200:**
```json
{
  "id": "withdrawal-uuid",
  "status": "pending|depix_received|processing|...",
  "breakdown": { ... },
  "user_tx_id": "tx-id ou null",
  "receipt_url": "https://... ou null",
  "created_at": "ISO8601",
  "completed_at": "ISO8601 ou null"
}
```

### 3.3 POST /internal/estimate-fee

**Request:**
```json
{
  "amount_reais": 1000.00
}
```

**Response 200:**
```json
{
  "breakdown": {
    "requested_amount": 1000.00,
    "partner_fee": 15.00,
    "eulen_fee": 10.00,
    "total_fee": 25.00,
    "total_depix": 1025.00
  }
}
```

### 3.4 GET /internal/limit/{tax_number}

**Response 200:**
```json
{
  "tax_number": "123.***.***-45",
  "daily_limit_cents": 500000,
  "daily_volume_cents": 150000,
  "remaining_cents": 350000,
  "daily_limit_reais": 5000.00,
  "daily_volume_reais": 1500.00,
  "remaining_reais": 3500.00,
  "has_euid": false
}
```

---

## 4. Estados do Saque

### 4.1 Diagrama de Transições

```
┌─────────┐
│ PENDING │ ← Criado, aguardando DePix
└────┬────┘
     │ [Usuário envia DePix]
     ▼
┌──────────────┐
│DEPIX_RECEIVED│ ← DePix detectado
└────┬─────────┘
     │ [Worker processa]
     ▼
┌─────────────┐
│ PROCESSING  │ ← Separando taxa
└────┬────────┘
     │ [Envia para Eulen]
     ▼
┌──────────────┐
│SENT_TO_EULEN │ ← Aguardando Eulen
└────┬─────────┘
     │ [Eulen processando]
     ▼
┌──────────────────┐
│EULEN_PROCESSING  │ ← PIX em processamento
└────┬─────────────┘
     │ [PIX enviado]
     ▼
┌───────────┐
│ COMPLETED │ ← PIX enviado com sucesso
└───────────┘
```

### 4.2 Todos os Estados

| Estado | Descrição | O que o usuário vê |
|--------|-----------|-------------------|
| `pending` | Aguardando DePix | "Aguardando pagamento" |
| `depix_received` | DePix recebido | "Processando" |
| `processing` | Separando taxa | "Processando" |
| `sent_to_eulen` | Enviado para Eulen | "Enviando PIX" |
| `eulen_processing` | Eulen processando | "Enviando PIX" |
| `completed` | PIX enviado | "Concluído" |
| `failed` | Erro | "Erro" |
| `refunded` | Reembolsado | "Reembolsado" |
| `expired` | Não pagou a tempo | "Expirado" |
| `canceled` | Cancelado | "Cancelado" |

---

## 5. Ciclo de Vida do Saque

### 5.1 Criação (POST /internal/withdrawals)

1. Valida limite diário do CPF/CNPJ
2. Calcula taxas (Eulen + Partner)
3. Chama API Eulen para criar ordem
4. Gera endereço Liquid único (LWK)
5. Salva no banco com status `PENDING`
6. Retorna endereço para o usuário
7. Incrementa volume diário

### 5.2 Detecção de Pagamento (Worker)

**Intervalo:** 30 segundos

1. Sincroniza carteira LWK com blockchain
2. Busca saques `PENDING` não expirados
3. Para cada saque, verifica balanço do endereço
4. Se balanço ≥ total_depix_cents:
   - Marca como `DEPIX_RECEIVED`
   - Processa envio para Eulen

### 5.3 Processamento para Eulen

1. Calcula valor a enviar (total - taxa partner)
2. Envia DePix via LWK para endereço Eulen
3. Registra transaction log
4. Atualiza status para `SENT_TO_EULEN`

### 5.4 Consulta de Status (Worker)

**Intervalo:** 30 segundos

| Status Eulen | Status Local |
|--------------|--------------|
| `UNSENT` | `SENT_TO_EULEN` |
| `SENDING` | `EULEN_PROCESSING` |
| `SENT` | `COMPLETED` |
| `ERROR` | `FAILED` |
| `CANCELED` | `CANCELED` |
| `REFUNDED` | `REFUNDED` |

---

## 6. Taxas

### 6.1 Fórmula

```
Eulen Fee = 1% do valor (mínimo R$ 1,00)
Partner Fee = Configurável (ex: 1.5% + R$ 0)
Total Fee = Eulen Fee + Partner Fee
Total DePix = Valor solicitado + Total Fee
```

### 6.2 Configuração

| Variável | Default | Descrição |
|----------|---------|-----------|
| `partner_withdraw_fee_percent` | 0.015 | 1.5% |
| `partner_withdraw_fee_fixed_cents` | 0 | R$ 0,00 fixo |
| `partner_withdraw_fee_min_cents` | 50 | Mínimo R$ 0,50 |

### 6.3 Exemplo

```
Valor solicitado: R$ 1.000,00
Eulen Fee: R$ 10,00 (1%)
Partner Fee: R$ 15,00 (1.5%)
Total Fee: R$ 25,00
Total DePix a enviar: R$ 1.025,00
```

---

## 7. Limites

### 7.1 Limite Diário

| Configuração | Valor |
|--------------|-------|
| Limite padrão por CPF/CNPJ | R$ 5.000,00/dia |
| Reset | Meia-noite UTC |
| Rastreamento | Por `tax_number` |

### 7.2 Prazos

| Operação | TTL |
|----------|-----|
| Pagamento do DePix | 24 horas |
| Polling de status | 30 segundos |

---

## 8. Erros Possíveis

| HTTP | Situação | Mensagem |
|------|----------|----------|
| 400 | Limite excedido | "Limite diário excedido. Disponível: R$ X" |
| 400 | Dados inválidos | "CPF/CNPJ inválido" |
| 400 | Não pode cancelar | "Saque não está pendente" |
| 403 | Acesso negado | "Acesso negado" |
| 404 | Não encontrado | "Saque não encontrado" |
| 500 | Erro Eulen | "Erro na API Eulen: ..." |

---

## 9. Modelo de Dados

### 9.1 Withdrawal

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | PK |
| `user_id` | String | ID do usuário (Laravel) |
| `status` | Enum | Estado |
| `flyerx_address` | String | Endereço Liquid (único) |
| `requested_amount_cents` | BigInt | Valor a receber em PIX |
| `partner_fee_cents` | BigInt | Taxa Flyerx |
| `eulen_fee_cents` | BigInt | Taxa Eulen |
| `total_depix_cents` | BigInt | Total a enviar em DePix |
| `pix_key` | String | Chave PIX destino |
| `pix_key_type` | String | Tipo da chave |
| `beneficiary_tax_number` | String | CPF/CNPJ do titular |
| `eulen_withdrawal_id` | String | ID na Eulen |
| `receipt_url` | String | Comprovante PIX |
| `expires_at` | DateTime | Expiração |
| `completed_at` | DateTime | Conclusão |
| `error_message` | String | Motivo de falha |

### 9.2 DailyWithdrawLimit

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `tax_number` | String | CPF/CNPJ (PK) |
| `daily_volume_cents` | BigInt | Volume do dia |
| `max_daily_cents` | BigInt | Limite máximo |
| `last_reset_date` | DateTime | Último reset |

### 9.3 TransactionLog

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | PK |
| `withdrawal_id` | String | FK |
| `type` | Enum | RECEIVED, SENT, FEE |
| `tx_id` | String | TX ID blockchain |
| `amount_cents` | BigInt | Valor |

---

## 10. Segurança

### 10.1 Autenticação

- Todos endpoints (exceto /health, /estimate-fee) requerem `X-API-Key`
- Chave configurada em `settings.api_key`
- Somente Laravel pode chamar

### 10.2 Isolamento

- Cada usuário só vê seus próprios saques
- Validação de `user_id` em todos os queries
- Limite diário por CPF/CNPJ

---

## Lacunas Identificadas

> **NOTA:** Estes são REGISTROS para decisão futura, não tarefas.

| # | Lacuna | Impacto | Observação |
|---|--------|---------|------------|
| 1 | Sem webhook de saída | Baixo | Laravel faz polling |
| 2 | Sem retry automático em falha | Médio | Saque falho precisa intervenção |
| 3 | Logs não centralizados | Baixo | Cada serviço tem seus logs |

---

*Documento gerado a partir do código em `flyerx-backend/src/` — é a fonte de verdade oficial.*
