# Catálogo do Provedor Eulen

**Gerado em:** 2026-08-06
**Fonte:** [AGUARDANDO DOCUMENTAÇÃO]
**Status:** Pendente documentação externa

---

## Status da Documentação

⚠️ **A pasta `docs/integracao/referencias/eulen/` não existe.**

Este catálogo requer documentação oficial da API Eulen (contratos, endpoints, webhooks, limites) para ser preenchido completamente.

---

## 1. O que sabemos pelo código

As informações abaixo foram extraídas do código do Laravel (`api/`) e do microserviço LWK (`flyerx-backend/`):

### 1.1 Endpoints Chamados

| Operação | Método | Endpoint | Chamado por |
|----------|--------|----------|-------------|
| Criar QR Code PIX | POST | `/deposit` | Laravel |
| Status de depósito | GET | `/deposit-status?id={id}` | Laravel |
| Criar saque PIX | POST | `/withdraw` | flyerx-backend |
| Status de saque | GET | `/withdraw-status?id={id}` | flyerx-backend |

### 1.2 Status de Depósito (Eulen → Interno)

| Status Eulen | Status Laravel |
|--------------|----------------|
| `pending`, `waiting` | `awaiting_payment` |
| `processing`, `in_progress` | `processing` |
| `paid`, `completed`, `confirmed` | `completed` |
| `expired`, `timeout` | `expired` |
| `failed`, `error`, `cancelled` | `failed` |

### 1.3 Status de Saque (Eulen → Interno)

| Status Eulen | Status Local |
|--------------|--------------|
| `UNSENT` | `sent_to_eulen` |
| `SENDING` | `eulen_processing` |
| `SENT` | `completed` |
| `ERROR` | `failed` |
| `CANCELED` | `canceled` |
| `REFUNDED` | `refunded` |

### 1.4 Webhooks Recebidos

| Evento | Ação no Laravel |
|--------|-----------------|
| `pix.deposit.confirmed` | Confirma depósito, credita carteira |
| `pix.deposit.expired` | Marca depósito como expirado |
| `pix.deposit.failed` | Marca depósito como falho |
| `pix.withdrawal.completed` | Confirma saque |
| `pix.withdrawal.failed` | Marca saque como falho, libera reserva |

### 1.5 Autenticação

- Webhooks validados via assinatura HMAC-SHA256
- Header: `X-Eulen-Signature`
- API calls autenticadas (detalhes não documentados)

### 1.6 Taxas

| Operação | Fórmula |
|----------|---------|
| Saque | 1% do valor (mínimo R$ 1,00) |
| Depósito | [AGUARDANDO DOCUMENTAÇÃO] |

---

## 2. Seções Pendentes

As seguintes seções requerem documentação oficial da Eulen:

### 2.1 [AGUARDANDO DOCUMENTAÇÃO] Contratos Completos

- Request/Response schemas para todos endpoints
- Campos obrigatórios vs opcionais
- Tipos de dados e validações

### 2.2 [AGUARDANDO DOCUMENTAÇÃO] Limites e Throttling

- Rate limits por endpoint
- Limites de valor por transação
- Limites diários/mensais

### 2.3 [AGUARDANDO DOCUMENTAÇÃO] Erros e Códigos

- Tabela de códigos de erro
- Mensagens de erro
- Estratégias de retry

### 2.4 [AGUARDANDO DOCUMENTAÇÃO] Ambiente

- URLs de produção vs sandbox
- Credenciais necessárias
- Certificados/mTLS

### 2.5 [AGUARDANDO DOCUMENTAÇÃO] Webhooks Completos

- Lista completa de eventos
- Payload schemas
- Retry policy
- Timeout de confirmação

---

## 3. Capacidades Não Utilizadas

> **NOTA:** Esta seção será preenchida após confronto com documentação oficial.

| Capacidade Eulen | Utilizada? | Observação |
|------------------|------------|------------|
| [AGUARDANDO DOCUMENTAÇÃO] | - | - |

---

## Ação Necessária

Para completar este catálogo:

1. Obter documentação oficial da API Eulen
2. Salvar em `docs/integracao/referencias/eulen/`
3. Preencher seções [AGUARDANDO DOCUMENTAÇÃO]
4. Confrontar com catálogos 00a e 00b para identificar capacidades não utilizadas

---

*Documento gerado parcialmente — aguardando documentação externa do provedor Eulen.*
