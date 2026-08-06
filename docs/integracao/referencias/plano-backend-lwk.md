# Plano de Implementação - Backend LWK para Saques com Taxa de Parceiro

> **NOTA (2026-08-06 — Passo 2.5):** Este documento descreve a arquitetura vigente do sistema de saques DePix→PIX implementado em `flyerx-backend/`. O código foi implementado seguindo este plano. Para detalhes da implementação atual, consultar o catálogo `00b-catalogo-microservico-lwk.md`.

---

## Visão Geral

Este documento descreve a arquitetura e implementação de um backend utilizando **LWK (Liquid Wallet Kit)** para processar saques (DePix → PIX) com cobrança de taxa de parceiro no Flyerx.

### Problema

A API Pix2Depix da Eulen **não suporta split de taxas em saques** (apenas em depósitos). Para cobrar taxa de parceiro em saques, é necessário um backend intermediário que:

1. Receba DePix do usuário em um endereço próprio
2. Separe a taxa do parceiro
3. Encaminhe o restante para a API Eulen processar o PIX

### Solução

Implementar um backend com LWK que atua como intermediário entre o usuário e a API Eulen.

---

## Arquitetura

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITETURA DO SISTEMA                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────┐
│   Frontend  │────▶│  Backend Flyerx │────▶│   API Eulen     │────▶│  Banco  │
│  (Next.js)  │     │  (Node/Python)  │     │  (Pix2Depix)    │     │  (PIX)  │
└─────────────┘     └────────┬────────┘     └─────────────────┘     └─────────┘
                             │
                    ┌────────▼────────┐
                    │   LWK Wallet    │
                    │ (Liquid Network)│
                    └─────────────────┘

Fluxo de Dados:
1. Frontend → Backend: Solicita saque
2. Backend → Eulen: Cria ordem de saque (recebe depositAddress)
3. Backend → LWK: Gera endereço para usuário
4. Usuário → LWK: Envia DePix
5. LWK Worker: Detecta, separa taxa, envia para Eulen
6. Eulen → Banco: Processa PIX
```

---

## Componentes

### 1. Backend API (Node.js/Python)

Responsável por:
- Receber solicitações de saque do frontend
- Comunicar com API Eulen
- Gerenciar endereços LWK
- Armazenar estado das transações

### 2. LWK Wallet Service

Responsável por:
- Gerar endereços Liquid para cada saque
- Monitorar transações recebidas
- Enviar DePix para endereços da Eulen

### 3. Worker de Processamento

Responsável por:
- Polling de transações pendentes
- Detecção de depósitos recebidos
- Processamento automático de envios

### 4. Banco de Dados

Armazena:
- Ordens de saque
- Mapeamento endereço → saque
- Status das transações
- Logs de auditoria

---

## Stack Tecnológica

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Backend API | Python + FastAPI | Compatibilidade com LWK |
| LWK | Python (`pip install lwk`) | SDK oficial mais maduro |
| Banco de Dados | PostgreSQL | Confiabilidade, ACID |
| Cache | Redis | Filas, locks distribuídos |
| Worker | Threading interno | Simplificação |

### Implementação escolhida: Python + FastAPI

```
Backend:     Python 3.11+ com FastAPI
LWK:         lwk (pip install lwk)
ORM:         SQLAlchemy
Worker:      Threading interno (polling)
Deploy:      Docker + Docker Compose
```

---

## Modelo de Dados

### Tabela: `withdrawals`

```sql
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Dados do usuário
    user_id UUID NOT NULL,
    pix_key VARCHAR(100) NOT NULL,
    pix_key_type VARCHAR(20) NOT NULL,
    beneficiary_tax_number VARCHAR(14) NOT NULL,

    -- Valores
    requested_amount_cents INTEGER NOT NULL,      -- Valor que usuário quer receber
    partner_fee_cents INTEGER NOT NULL,           -- Taxa do parceiro Flyerx
    eulen_fee_cents INTEGER NOT NULL,             -- Taxa da Eulen
    total_depix_cents INTEGER NOT NULL,           -- Total que usuário deve enviar

    -- Endereços Liquid
    flyerx_address VARCHAR(150) NOT NULL,         -- Endereço LWK gerado
    flyerx_address_index INTEGER NOT NULL,        -- Índice HD do endereço
    eulen_deposit_address VARCHAR(150),           -- Endereço da Eulen

    -- IDs externos
    eulen_withdrawal_id VARCHAR(100),             -- ID retornado pela Eulen

    -- Transações blockchain
    user_tx_id VARCHAR(100),                      -- TX do usuário → Flyerx
    flyerx_to_eulen_tx_id VARCHAR(100),           -- TX do Flyerx → Eulen

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    status_history JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    user_deposit_at TIMESTAMP,
    sent_to_eulen_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Metadados
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);
```

### Enum: Status do Saque

```typescript
type WithdrawalStatus =
  | 'pending'              // Aguardando usuário enviar DePix
  | 'depix_received'       // DePix recebido no endereço Flyerx
  | 'processing'           // Processando envio para Eulen
  | 'sent_to_eulen'        // DePix enviado para Eulen
  | 'eulen_processing'     // Eulen processando PIX
  | 'completed'            // PIX enviado com sucesso
  | 'failed'               // Erro no processo
  | 'refunded'             // Reembolsado ao usuário
  | 'expired';             // Expirado (usuário não enviou)
```

---

## Taxas

### Fórmula

```
Eulen Fee = 1% do valor (mínimo R$ 1,00)
Partner Fee = Configurável (ex: 1.5% + R$ 0)
Total Fee = Eulen Fee + Partner Fee
Total DePix = Valor solicitado + Total Fee
```

### Configuração

| Variável | Default | Descrição |
|----------|---------|-----------|
| `partner_withdraw_fee_percent` | 0.015 | 1.5% |
| `partner_withdraw_fee_fixed_cents` | 0 | R$ 0,00 fixo |
| `partner_withdraw_fee_min_cents` | 50 | Mínimo R$ 0,50 |

### Exemplo

```
Valor solicitado: R$ 1.000,00
Eulen Fee: R$ 10,00 (1%)
Partner Fee: R$ 15,00 (1.5%)
Total Fee: R$ 25,00
Total DePix a enviar: R$ 1.025,00
```

---

## Limites

### Limite Diário

| Configuração | Valor |
|--------------|-------|
| Limite padrão por CPF/CNPJ | R$ 5.000,00/dia |
| Reset | Meia-noite UTC |
| Rastreamento | Por `tax_number` |

### Prazos

| Operação | TTL |
|----------|-----|
| Pagamento do DePix | 24 horas |
| Polling de status | 30 segundos |

---

## Segurança

### 1. Proteção do Mnemonic

**CRÍTICO:** O mnemonic da carteira LWK nunca deve ser armazenado em `.env` em produção.

Usar vault seguro:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault

### 2. Validação de Endereços

Validar prefixos Liquid: `lq1`, `ex1`, `VJL`, `VTp`

### 3. Rate Limiting

5 saques por minuto por usuário.

### 4. Logs de Auditoria

Registrar todas as operações com IP, timestamp e resultado.

---

## Checklist de Verificação Pós-Implementação

- [ ] Worker detecta DePix recebido em menos de 1 minuto
- [ ] Taxa é corretamente retida na carteira Flyerx
- [ ] Valor correto é repassado à Eulen
- [ ] Status é atualizado em tempo real
- [ ] Saque expirado não processa DePix tardio
- [ ] Retry automático em caso de falha de rede
- [ ] Alerta enviado em caso de falha persistente
- [ ] Mnemonic protegido em vault (produção)

---

*Documento original do planejamento. Implementação em `flyerx-backend/`. Conferir catálogo `00b-catalogo-microservico-lwk.md` para estado atual.*
