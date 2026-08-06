# Catálogo do Provedor Eulen (API Pix2Depix)

**Gerado em:** 2026-08-06
**Fonte:** Documentação oficial em docs.eulen.app + código do Laravel
**Status:** Fonte de verdade oficial

---

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| URL Base (produção) | `https://depix.eulen.app/api/` |
| Autenticação | JWT Bearer Token (gerado via Telegram Bot) |
| Endpoints principais | 7 (ping, deposit, deposit-status, deposits, user-info, withdraw, withdraw-status) |
| Status de depósito | 10 (pending, delayed, under_review, approved, depix_sent, will_refund, refunded, canceled, expired, error) |
| Status de saque | 6 (unsent, sending, sent, error, canceled, refunded) |
| Webhooks | 3 tipos (deposit, withdraw, MED) |

---

## 1. Autenticação

### 1.1 Formato

- **Tipo:** JWT Bearer Token
- **Header:** `Authorization: Bearer <token>`
- **Geração:** Exclusivamente via Telegram Bot da Eulen

### 1.2 Comando de Geração

```
/apitoken <label> <days> [all|deposit|withdraw|user]
```

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `label` | Identificador sem espaços | `server001` |
| `days` | Validade em dias (max: 365) | `7` |
| `scope` | Permissões | `all`, `deposit`, `withdraw` |

---

## 2. Endpoints

### 2.1 POST /deposit

Gera QR Code PIX dinâmico para depósito em BRL, convertendo automaticamente para DePix após confirmação.

**Request Body:**

| Campo | Tipo | Obrigatório | Intervalo | Descrição |
|-------|------|-------------|-----------|-----------|
| `amountInCents` | integer | Sim | 1-10.000.000 | Valor em centavos (100 = R$ 1,00) |
| `endUserTaxNumber` | string | Sim | - | CPF/CNPJ do usuário final |
| `euid` | string | Não | - | Eulen User ID do pagador |
| `delayDepixInHours` | integer | Não | 1-720 | Horas para atrasar conversão DePix |
| `depixAddress` | string | Não | - | Endereço DePix customizado |
| `whitelist` | boolean | Não | - | Flag de lista branca |
| `merchantId` | string | Não | - | EUID do estabelecimento |

**Response (200 OK):**

```json
{
  "response": {
    "qrCopyPaste": "string",
    "qrImageUrl": "string",
    "id": "string"
  },
  "async": false
}
```

### 2.2 GET /deposit-status

**Query Parameters:**
- `id`: ID do depósito (obrigatório)

**Response (DepositStatusObj):**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `qrId` | string | Sim | ID único do QR Code |
| `status` | DepositStatus | Sim | Status atual |
| `valueInCents` | integer | Sim | Valor em centavos |
| `expiration` | datetime | Sim | Expiração do QR Code |
| `payerName` | string | Sim | Nome do pagador |
| `payerTaxNumber` | string | Sim | CPF/CNPJ do pagador |
| `payerEUID` | string | Sim | EUID do pagador |
| `pixKey` | string | Sim | Chave PIX do QR Code |
| `bankTxId` | string | Não | ID da transação bancária |
| `blockchainTxID` | string | Não | ID da transação blockchain |
| `customerMessage` | string | Não | Mensagem do pagador |
| `delayUntil` | datetime | Não | Quando será processado (se delayed) |

### 2.3 GET /deposits (Fallback)

Lista depósitos em formato compacto. **Uso:** fallback quando webhooks falham.

**Query Parameters:**
- `start`: Data inicial (YYYY-MM-DD ou RFC3339, obrigatório)
- `end`: Data final (YYYY-MM-DD ou RFC3339, obrigatório)
- `status`: Filtro por status (opcional)

**Limite:** Máximo 200 registros por consulta.

### 2.4 POST /withdraw

Cria saque PIX (DePix → BRL).

**Request Body:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `pixKey` | string | Sim | Chave PIX destino |
| `depositAmountInCents` | integer | Condicional | Valor DePix a depositar (OU payoutAmountInCents) |
| `payoutAmountInCents` | integer | Condicional | Valor PIX final (OU depositAmountInCents) |
| `taxNumber` | string | Condicional | CPF/CNPJ do dono da chave (obrigatório a partir de 01/05/2026) |
| `euid` | string | Condicional | EUID do beneficiário |

**Regras críticas:**
- Usar EXATAMENTE UM entre `depositAmountInCents` ou `payoutAmountInCents`
- A partir de 01/05/2026: obrigatório `taxNumber` ou `euid`
- Chave PIX deve pertencer ao `taxNumber` informado

**Response (WithdrawObj):**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `withdrawalId` | string | ID do saque |
| `depositAddress` | string | Endereço blockchain para envio |
| `depositAmountInCents` | integer | Valor DePix a enviar |
| `payoutAmountInCents` | integer | Valor PIX final (após taxas) |

### 2.5 GET /withdraw-status

**Response (WithdrawStatusObj):**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | Sim | ID do saque |
| `pixKey` | string | Sim | Chave PIX destino |
| `status` | WithdrawStatus | Sim | Status atual |
| `expiration` | datetime | Sim | Expiração do endereço blockchain |
| `depositAddress` | string | Sim | Endereço blockchain |
| `depositAmountInCents` | integer | Sim | Valor DePix |
| `payoutAmountInCents` | integer | Sim | Valor PIX final |
| `blockchainTxID` | string | Não | ID da transação blockchain |
| `receiptUrl` | string | Não | URL do comprovante |
| `receiverName` | string | Não | Nome do recebedor |
| `receiverTaxNumber` | string | Não | CPF/CNPJ mascarado |
| `transferDate` | datetime | Não | Data da transferência |
| `centralBankId` | string | Não | ID PIX (End-to-End) |

### 2.6 GET /user-info

Consulta limites e uso de volume por usuário.

**Query Parameters:**
- `euid`: Eulen User ID (opcional)

**Response:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `dailyVolumeInCents` | integer | Volume utilizado hoje |
| `maxDailyInCents` | integer | Limite diário máximo |
| `isBlocked` | boolean | Usuário bloqueado? |
| `dailyLimitResetTime` | datetime | Quando o limite reseta |

### 2.7 GET /ping

Health check. Retorna "Pong!" e JWT decodificado para debug.

---

## 3. Status por Operação

### 3.1 Status de Depósito (DepositStatus)

| Status | Descrição | Terminal? | O que o usuário vê |
|--------|-----------|-----------|-------------------|
| `pending` | QR Code gerado, aguardando pagamento | Não | "Aguardando pagamento" |
| `delayed` | Pagamento postergado (QR Delay ativo) | Não | "Aguardando processamento" |
| `under_review` | Pagamento recebido, em análise | Não | "Em análise" |
| `approved` | Pagamento aprovado, aguardando envio | Não | "Processando" |
| `depix_sent` | DePix enviado ao parceiro | Sim | "Concluído" |
| `will_refund` | Será reembolsado (violação de compliance) | Não | "Em devolução" |
| `refunded` | Valor devolvido ao pagador | Sim | "Devolvido" |
| `canceled` | Cancelado pelo usuário/parceiro/Eulen | Sim | "Cancelado" |
| `expired` | QR Code expirou sem pagamento | Sim | "Expirado" |
| `error` | Erro no processamento | Sim | "Falhou" |

### 3.2 Status de Saque (WithdrawStatus)

| Status | Descrição | Terminal? | O que o usuário vê |
|--------|-----------|-----------|-------------------|
| `unsent` | Criado, ainda não submetido | Não | "Aguardando envio" |
| `sending` | Sendo processado pelo parceiro bancário | Não | "Processando" |
| `sent` | Enviado com sucesso | Sim | "Concluído" |
| `error` | Erro no processamento | Sim | "Falhou" |
| `canceled` | Cancelado antes do envio | Sim | "Cancelado" |
| `refunded` | Falhou após dedução, fundos devolvidos | Sim | "Devolvido" |

---

## 4. Webhooks

### 4.1 Visão Geral

| Tipo | webhookType | Quando dispara |
|------|-------------|----------------|
| Depósito | `deposit` | Mudança de status de depósito |
| Saque | `withdraw` | Mudança de status de saque |
| MED | `med` | Devolução especial PIX |

**Autenticação:** Header `Authorization: Basic [base64_encoded_secret]`
**Timeout:** Máximo 15 segundos para responder 200 OK

### 4.2 DepositWebhookBody

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `webhookType` | string | Sim | "deposit" |
| `qrId` | string | Sim | ID do QR Code |
| `status` | DepositStatus | Sim | Status atual |
| `valueInCents` | integer | Sim | Valor em centavos |
| `expiration` | datetime | Sim | Expiração do QR |
| `payerName` | string | Sim | Nome do pagador |
| `payerTaxNumber` | string | Sim | CPF/CNPJ do pagador |
| `payerEUID` | string | Sim | EUID do pagador |
| `pixKey` | string | Sim | Chave PIX |
| `bankTxId` | string | Não | ID transação bancária |
| `blockchainTxID` | string | Não | ID transação blockchain |
| `customerMessage` | string | Não | Mensagem do pagador |
| `delayUntil` | datetime | Não | Quando será processado |

### 4.3 WithdrawWebhookBody

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `webhookType` | string | Sim | "withdraw" |
| `id` | string | Sim | ID do saque |
| `pixKey` | string | Sim | Chave PIX destino |
| `status` | WithdrawStatus | Sim | Status atual |
| `expiration` | datetime | Sim | Expiração do endereço |
| `depositAddress` | string | Sim | Endereço blockchain |
| `depositAmountInCents` | integer | Sim | Valor DePix |
| `payoutAmountInCents` | integer | Sim | Valor PIX final |
| `blockchainTxID` | string | Não | ID transação blockchain |
| `receiptUrl` | string | Não | URL do comprovante |
| `receiverName` | string | Não | Nome do recebedor |
| `receiverTaxNumber` | string | Não | CPF/CNPJ mascarado |
| `transferDate` | datetime | Não | Data da transferência |
| `centralBankId` | string | Não | ID PIX (E2E) |

### 4.4 MEDWebhookBody (Mecanismo Especial de Devolução)

**O que é o MED:**
O Mecanismo Especial de Devolução é um procedimento do Banco Central do Brasil que permite a devolução de valores em casos de fraude, falha operacional ou erro do sistema. Quando um MED é acionado, o valor do PIX pode ser devolvido até 90 dias após a transação original.

**Quando dispara:**
- Contestação de fraude pelo pagador
- Ordem judicial
- Falha operacional identificada
- Erro do sistema

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `webhookType` | string | Sim | "med" |
| `bankTxId` | string | Sim | ID da transação bancária original |
| `qrId` | string | Sim | ID do QR Code relacionado |
| `creationDateReport` | datetime | Sim | Data/hora do relatório MED |
| `name` | string | Sim | Nome do usuário |
| `taxNumber` | string | Sim | CPF/CNPJ do usuário |
| `euid` | string | Sim | EUID do usuário |
| `partnerId` | string | Sim | ID do parceiro |
| `principalValueInCents` | integer | Sim | Valor principal em centavos |
| `blockchainTxID` | string | Não | ID transação blockchain |

**Implicações para a plataforma:**
- **RISCO:** Valor já creditado na carteira pode precisar ser estornado
- **AÇÃO:** Plataforma deve reservar ou bloquear o valor até resolução
- **COMPLIANCE:** Deve haver processo para contestar ou aceitar o MED
- **REGISTRO:** Toda ocorrência deve ser registrada para auditoria

---

## 5. Capacidades Avançadas

### 5.1 QR Delay

Permite atrasar a conversão DePix após o pagamento PIX ser confirmado.

**Uso:** Análise de fraude, controle de exposição ao MED.

**Parâmetro:** `delayDepixInHours` (1-720 horas)

**Comportamento:**
1. QR Code PIX gerado normalmente
2. Pagamento recebido → status `delayed`
3. Após período → conversão DePix
4. Não pode ser alterado após geração

### 5.2 Nonce (Idempotência)

**Header:** `X-Nonce: <uuid>`

**Regras:**
- UUID aleatório por intenção de requisição
- REUTILIZAR em retries da mesma requisição
- NOVO para operações diferentes
- Previne duplicação de operações

### 5.3 Sync/Async

**Header:** `X-Async: true|false|auto`

| Modo | Comportamento | Timeout |
|------|---------------|---------|
| `auto` (padrão) | Espera 10s, vira async se não completar | 5 min na fila |
| `false` (sync) | Espera 10s, erro 503 se não completar | 10s |
| `true` (async) | Retorna imediatamente com URL de polling | 5 min na fila |

### 5.4 Restrição de Pagador

O campo `endUserTaxNumber` permite validar que o pagador do PIX é o mesmo informado na criação do QR Code.

**Uso:** Compliance, prevenção de fraude.

---

## 6. Limites da API (Rate Limiting)

| Endpoint | Taxa Sustentada | Burst |
|----------|-----------------|-------|
| `/ping` | 1/min | 1 |
| `/deposit` | 15/min | 50 |
| `/deposit-status` | 60/min | 50 |
| `/deposits` | 12/min | 10 |
| `/withdraw` | 10/min | 50 |
| `/withdraw-status` | 60/min | 50 |

**Comportamento:** Requisições excedentes são rejeitadas.

---

## 7. Confronto: Eulen vs Implementação Laravel

### 7.1 Mapeamento de Status

**Depósito (config/eulen.php):**

| Status Eulen | Status Laravel | Observação |
|--------------|----------------|------------|
| `pending` | `pending` | OK |
| `under_review` | `processing` | OK |
| `approved` | `processing` | OK |
| `depix_sent` | `confirmed` | OK |
| `delayed` | `processing` | OK |
| `refunded` | `refunded` | OK |
| `canceled` | `cancelled` | OK |
| `expired` | `expired` | OK |
| `error` | `failed` | OK |
| `will_refund` | **NÃO MAPEADO** | Lacuna |

**Saque (config/eulen.php):**

| Status Eulen | Status Laravel | Observação |
|--------------|----------------|------------|
| `unsent` | `pending` | OK |
| `sending` | `processing` | OK |
| `sent` | `confirmed` | OK |
| `refunded` | `refunded` | OK |
| `cancelled` | `cancelled` | OK |
| `error` | `failed` | OK |
| `expired` | `expired` | OK (não documentado na Eulen, mas mapeado) |

### 7.2 VALOR NÃO APROVEITADO

> **DOUTRINA:** Esta tabela é REGISTRO para decisão futura, não backlog ou tarefa.

| # | Capacidade Eulen | Utilizada? | Onde deveria estar | Observação/Risco |
|---|------------------|------------|-------------------|------------------|
| **Status/Eventos** |
| 1 | Status `will_refund` | **NÃO** | config/eulen.php | Transição antes de `refunded`; usuário não sabe que vai receber devolução |
| 2 | Status `delayed` (visibilidade) | **PARCIAL** | Frontend | Mapeado como `processing`, não distingue espera programada |
| 3 | Status `under_review` (visibilidade) | **PARCIAL** | Frontend | Mapeado como `processing`, não distingue análise de compliance |
| 4 | Webhook MED | **NÃO** | WebhookController | **RISCO:** Devolução pós-confirmação não tratada; saldo pode ficar negativo |
| **Dados do Pagador** |
| 5 | `payerName` via webhook | **NÃO EXPOSTO** | Frontend | Disponível no webhook, não mostrado ao usuário |
| 6 | `payerTaxNumber` via webhook | **NÃO EXPOSTO** | Frontend | Disponível no webhook, não mostrado ao usuário |
| 7 | `payerEUID` via webhook | **NÃO USADO** | - | Poderia rastrear pagadores recorrentes |
| 8 | `customerMessage` via webhook | **NÃO USADO** | - | Mensagem do pagador ignorada |
| **Funcionalidades** |
| 9 | QR Delay (`delayDepixInHours`) | **NÃO** | EulenProvider | Não envia parâmetro; conversão sempre imediata |
| 10 | `/user-info` (limites dinâmicos) | **NÃO** | - | Limites hardcoded no Laravel vs. limites reais por EUID na Eulen |
| 11 | `/deposits` (fallback) | **NÃO** | - | Polling usa apenas `/deposit-status` individual, não listagem |
| 12 | `whitelist` flag | **NÃO** | EulenProvider | Não envia parâmetro |
| 13 | `merchantId` | **NÃO** | EulenProvider | Não envia parâmetro |
| **Headers/Comportamento** |
| 14 | `X-Async` header | **NÃO** | EulenProvider | Sempre usa modo `auto` implícito |
| 15 | `taxNumber` no `/withdraw` | **PARCIAL** | EulenProvider | Envia como `recipient_document`, não como `taxNumber` |
| 16 | `euid` no `/withdraw` | **NÃO** | EulenProvider | Não envia EUID do beneficiário |
| **Saques** |
| 17 | `receiptUrl` | **NÃO EXPOSTO** | Frontend | Comprovante bancário disponível, não mostrado |
| 18 | `centralBankId` (E2E ID) | **PARCIAL** | Armazenado, não exposto | Guardado como `end_to_end_id`, não mostrado ao usuário |
| **Infraestrutura** |
| 19 | Sync de depósitos via polling | **SIM** | Scheduler | Comando existe mas sincroniza via `/deposit-status` individual |
| 20 | Webhook como fonte primária | **PARCIAL** | WebhookController | Implementado, mas `validate_signature` = false por padrão |

### 7.3 Análise de Risco: MED

**Situação atual:**
- O webhook MED da Eulen NÃO é tratado pelo `WebhookController`
- Se um MED for acionado contra uma transação já confirmada:
  1. Usuário já recebeu crédito na carteira
  2. Usuário pode ter sacado o valor
  3. Saldo pode ficar negativo
  4. Plataforma assume o prejuízo

**Cenário de risco:**
1. Usuário A deposita R$ 1.000 via PIX
2. Depósito confirmado, saldo creditado
3. Usuário A saca R$ 1.000
4. 30 dias depois: MED acionado (fraude no PIX original)
5. Eulen envia webhook MED
6. Laravel ignora webhook (evento desconhecido)
7. Eulen estorna R$ 1.000 da conta do parceiro
8. Plataforma tem prejuízo de R$ 1.000

**Registro:** Esta é uma decisão de negócio sobre como tratar MEDs. Opções:
- Implementar tratamento do webhook MED
- Usar QR Delay para ter janela de contestação
- Criar reserva de contingência
- Aceitar o risco como custo operacional

### 7.4 Análise: Polling vs Webhooks

**Situação atual:**
- Laravel implementa webhooks para depósito/saque
- Laravel também faz polling a cada 5 minutos (`flyerx:sync-deposits`)
- Validação de assinatura de webhook desabilitada por padrão

**Documentação Eulen:**
- Webhooks em fase beta
- Recomenda usar `/deposits` como fallback
- `/deposit-status` tem rate limit de 60/min (OK para polling individual)
- `/deposits` tem rate limit de 12/min (melhor para fallback em lote)

**Registro:** A implementação atual é defensiva (polling + webhook). O fallback `/deposits` seria mais eficiente para verificar múltiplos depósitos de uma vez.

---

## 8. Referências

- Índice da documentação: `docs/integracao/referencias/eulen/llmsEULEN.txt`
- URL base da documentação: https://docs.eulen.app/
- Implementação Laravel: `api/app/Infrastructure/Payment/Providers/EulenProvider.php`
- Configuração: `api/config/eulen.php`

---

*Documento gerado a partir da documentação oficial da Eulen e confrontado com o código em `api/` — é a fonte de verdade oficial.*
