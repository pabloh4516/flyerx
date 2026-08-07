# Decisões de Conteúdo e Integração — Flyerx Web v1

**Gerado em:** 2026-08-06
**Revisado em:** 2026-08-06 (Passo 2.5 — Arquitetura Definitiva)
**Status:** Arquitetura confirmada — intermediador não-custodial

---

## Sumário Executivo — Arquitetura Definitiva

### Modelo de Negócio

**Flyerx = INTERMEDIADOR NÃO-CUSTODIAL** (gateway Pix↔DePix) sobre a API Eulen.

O Flyerx NÃO mantém saldo BRL custodial. O usuário mantém seu próprio DePix em carteira Liquid externa (Aqua, SideSwap, etc). O Flyerx orquestra conversões Pix↔DePix cobrando taxas na origem.

### Papéis dos Backends

| Backend | Papel | Responsabilidades |
|---------|-------|-------------------|
| **Laravel (api/)** | Backend PRINCIPAL | Auth, usuários, wallet (cadastro do endereço Liquid do usuário), DEPÓSITOS (chamada server-side à Eulen com split), LIVRO-RAZÃO (registro de todas operações para extrato/contabilidade/MED) |
| **Python (flyerx-backend/)** | Microserviço de SAQUES | Processa saques DePix→PIX. Existe porque a Eulen não tem split em saques. Gera endereço HD único por saque, retém taxa Flyerx, repassa à Eulen |

### Fluxo de Valor (Simplificado)

```
DEPÓSITO (PIX → DePix):
┌─────────┐   PIX    ┌─────────┐  DePix   ┌─────────────────┐
│ Pagador │────────▶│  Eulen  │────────▶│ Carteira usuário │
└─────────┘         └─────────┘ (split)  └─────────────────┘
                         │
                         └─────▶ Carteira Flyerx (taxa)

SAQUE (DePix → PIX):
┌─────────────────┐  DePix   ┌────────────────┐  DePix   ┌─────────┐   PIX
│ Carteira usuário│────────▶│flyerx-backend  │────────▶│  Eulen  │────────▶│Beneficiário│
└─────────────────┘ (total)  │  (retém taxa)  │ (líq.)  └─────────┘         └────────────┘
```

### O que NÃO existe

- **Saldo BRL custodial**: Código legado no Laravel, fora de qualquer fluxo v1
- **Split em saques via Eulen**: Por isso existe o microserviço Python
- **Depósito via frontend direto à Eulen**: Deve passar pelo Laravel (auditoria + split)

---

## Índice

- [A. Spec por Tela v1](#a-spec-por-tela-v1)
- [B. Mapa de Religação](#b-mapa-de-religação)
- [C. Backend Novo](#c-backend-novo)
- [D. Pipeline de Registro](#d-pipeline-de-registro)
- [E. Navegação v1](#e-navegação-v1)
- [F. Fila de Execução](#f-fila-de-execução)
- [G. Pré-Go-Live](#g-pré-go-live)
- [H. Registros Pós-v1](#h-registros-pós-v1)

---

## A. Spec por Tela v1

### A.1 Dashboard

**Caminho:** `(main)/dashboard/page.tsx`

#### Conteúdo Final

| Dado | Fonte | Observação |
|------|-------|------------|
| Nome do usuário | `useAuthStore` → `user.name` | REAL — manter |
| Nível de verificação | `useAuthStore` → `user.kycLevel` | REAL — manter |
| Saldo disponível | **REMOVER** | Modelo não-custodial não tem saldo BRL |
| Transações recentes (3) | `useTransactions()` → `/v1/wallet/history` | REAL — manter |
| Entradas/Saídas do dia | **REMOVER** | Mock hardcoded |
| Chaves cadastradas | **REMOVER** | Mock — funcionalidade pós-v1 |
| Sparkline (gráfico) | **REMOVER** | Mock — dados fictícios |
| Saudação (Bom dia) | `Date` local | DERIVADO — manter |

#### Layout v1 Simplificado

```
┌─────────────────────────────────────────────────┐
│ Saudação + Data                                 │
├─────────────────────────────────────────────────┤
│ Card: Sua carteira Liquid                       │
│       lq1qq... [Copiar]                         │
│       (ou CTA "Cadastrar carteira")             │
├─────────────────────────────────────────────────┤
│ Quick Actions: Receber | Enviar | Extrato | ... │
├─────────────────────────────────────────────────┤
│ Últimas transações (3)                          │
│ └─ [Ver extrato completo →]                     │
└─────────────────────────────────────────────────┘
```

---

### A.2 Receive (Receber PIX → DePix)

**Caminho:** `(main)/receive/page.tsx`

#### Arquitetura v1

```
receive/page.tsx
    └─→ useCreateDeposit()
        └─→ lib/api/deposits.ts
            └─→ POST /v1/deposits (Laravel)
                └─→ Laravel chama Eulen /deposit com:
                    - depixAddress = carteira Liquid do USUÁRIO
                    - depixSplitAddress = carteira Flyerx
                    - splitFee = taxa percentual
                └─→ Webhook atualiza status no Laravel
                └─→ DePix entregue direto na carteira do usuário
```

**DEPENDÊNCIA BLOQUEANTE:** Usuário precisa ter carteira Liquid cadastrada antes de criar depósito.

#### Conteúdo Final

| Dado | Fonte | Observação |
|------|-------|------------|
| Endereço Liquid do usuário | `useLiquidAddress()` | **NOVO** — exibir ou CTA |
| Limites (min/max) | Config local (pós-v1: `/user-info`) | Manter |
| Taxas | Config local | Manter |
| QR Code PIX | `useCreateDeposit()` → `qrCodeUrl` | Religação |
| Código copia e cola | `useCreateDeposit()` → `pixCopyPaste` | Religação |
| Status do depósito | `useDeposit(id)` → polling | Religação |
| Countdown expiração | `expiresAt` do response | Implementar |
| Valor líquido | Calculado: `amount - fee` | DERIVADO |

#### Estados de Depósito (Eulen → UI)

| Status Eulen | Status UI | Mensagem |
|--------------|-----------|----------|
| `pending` | Aguardando | "Aguardando pagamento PIX" |
| `under_review` | Processando | "Pagamento recebido, em análise" |
| `delayed` | Processando | "Processando (delay configurado)" |
| `approved` | Processando | "Pagamento confirmado, convertendo" |
| `depix_sent` | Concluído | "DePix enviado para sua carteira!" |
| `will_refund` | Devolvendo | "Pagamento será devolvido ao pagador" |
| `refunded` | Devolvido | "Pagamento devolvido" |
| `expired` | Expirado | "QR Code expirou" |
| `error` | Erro | "Erro no processamento" |

#### Fluxo Bloqueado (sem carteira)

Se usuário não tem `liquid_address` cadastrado:

1. Exibir aviso: "Para receber, cadastre sua carteira Liquid"
2. Botão CTA → `/wallet`
3. Input de valor e botão "Gerar QR Code" desabilitados

---

### A.3 Send (Enviar DePix → PIX)

**Caminho:** `(main)/send/page.tsx`

#### Arquitetura v1 (FLUXO PYTHON INTACTO)

O fluxo de saque usa o microserviço Python (`flyerx-backend/`). O usuário AINDA precisa enviar DePix de sua carteira externa para um endereço Liquid gerado pelo sistema.

```
send/page.tsx
    └─→ useCreateWithdrawal()
        └─→ lib/api/withdrawals.ts
            └─→ POST /v1/withdrawals (Laravel)
                └─→ Laravel chama Python /internal/withdrawals
                    └─→ Python chama Eulen /withdraw (obtém depositAddress)
                    └─→ Python gera flyerx_address (LWK HD único)
                    └─→ Python retorna flyerx_address para usuário
                └─→ Usuário envia DePix (valor + taxas) para flyerx_address
                └─→ Worker Python detecta, retém taxa, repassa à Eulen
                └─→ Eulen dispara PIX
```

#### Spec do Contrato UI

**Request (criar saque):**
```json
{
  "pix_key": "chave_pix",
  "pix_key_type": "CPF|CNPJ|EMAIL|PHONE|RANDOM",
  "beneficiary_tax_number": "CPF/CNPJ do dono da chave (obrigatório)",
  "amount": 100000  // centavos
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "pending",
  "flyerx_address": "lq1qq...",
  "breakdown": {
    "requested_amount": 1000.00,
    "partner_fee": 15.00,
    "eulen_fee": 10.00,
    "total_fee": 25.00,
    "total_depix": 1025.00
  },
  "expires_at": "ISO8601"
}
```

#### Estados de Saque (9 status internos do Python)

| Status Python | Step UI | Visual | Ação do Usuário |
|---------------|---------|--------|-----------------|
| `pending` | 3. Enviar DePix | spinner | Enviar DePix para o endereço |
| `depix_received` | 4. Processando | spinner | Aguardar |
| `processing` | 4. Processando | spinner | Aguardar |
| `sent_to_eulen` | 4. Processando | spinner | Aguardar |
| `eulen_processing` | 4. Processando | spinner | Aguardar |
| `completed` | 5. Concluído | check verde | Copiar E2E, ver comprovante |
| `failed` | Erro | X vermelho | Ver mensagem, tentar novamente |
| `refunded` | Devolvido | seta | DePix devolvido à carteira |
| `expired` | Expirado | relógio | Criar novo saque |

#### Anatomia v1 — Steps Verticais

```
┌─────────────────────────────────────────────────┐
│ Step 1: Informar Chave PIX                      │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Input] Chave PIX                           │ │
│ │ [Select] Tipo: CPF | CNPJ | Email | ...     │ │
│ │ [Input] CPF/CNPJ do titular da chave        │ │
│ │                                             │ │
│ │ ⚠️ A chave PIX deve pertencer ao CPF/CNPJ   │ │
│ │    informado. Verifique antes de prosseguir.│ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Step 2: Valor                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ [AmountInput] R$ ____                       │ │
│ │                                             │ │
│ │ Você envia (DePix): R$ 1.025,00             │ │
│ │ ├─ Valor do PIX:    R$ 1.000,00             │ │
│ │ ├─ Taxa Eulen (1%): R$    10,00             │ │
│ │ └─ Taxa Flyerx:     R$    15,00             │ │
│ │                                             │ │
│ │ [Continuar]                                 │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Step 3: Enviar DePix                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ Envie EXATAMENTE o valor abaixo:            │ │
│ │                                             │ │
│ │ ╔═════════════════════════════════════════╗ │ │
│ │ ║  R$ 1.025,00 DePix                      ║ │ │
│ │ ╚═════════════════════════════════════════╝ │ │
│ │                                             │ │
│ │ Para o endereço:                            │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ [QR Code do endereço Liquid]            │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ │ lq1qqw5h7r...abc123  [Copiar]               │ │
│ │                                             │ │
│ │ ⏱️ Expira em: 23:45:12                      │ │
│ │                                             │ │
│ │ ⚠️ ATENÇÃO: Envie o valor EXATO.            │ │
│ │ Valores diferentes causam perda dos fundos. │ │
│ │ Nunca envie após a expiração.               │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Step 4: Acompanhamento                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ ◐ Aguardando envio DePix...                 │ │
│ │ → ◐ DePix recebido, processando...          │ │
│ │ → ◐ Enviando PIX...                         │ │
│ │ → ✓ PIX enviado!                            │ │
│ │                                             │ │
│ │ Chave destino: ***email@***                 │ │
│ │ Valor PIX: R$ 1.000,00                      │ │
│ │ E2E: E00000000... [Copiar]                  │ │
│ │ [Ver comprovante]                           │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

#### Avisos Obrigatórios (Requisitos Eulen)

**Step 1 (antes de continuar):**
> A chave PIX deve pertencer ao CPF/CNPJ informado. Verifique com cuidado — após o envio do DePix, a transferência não pode ser cancelada.

**Step 3 (ao exibir endereço):**
> **ATENÇÃO:**
> - Envie o valor **EXATO** indicado (R$ X.XXX,XX)
> - Valores diferentes causam **perda irreversível** dos fundos
> - **Nunca** envie após a expiração do endereço

#### Campos Disponíveis no Response Final

| Campo | Disponível quando | Uso na UI |
|-------|-------------------|-----------|
| `receipt_url` | `status = completed` | Botão "Ver comprovante" |
| `end_to_end_id` | `status = completed` | Campo copiável |
| `transfer_date` | `status = completed` | Exibir data/hora |
| `receiver_name` | `status = completed` | Exibir confirmação |
| `error_message` | `status = failed` | Exibir motivo |

---

### A.4 History (Extrato)

**Caminho:** `(main)/history/page.tsx`

#### Fonte de Dados

**Fonte:** Ledger do Laravel (`GET /v1/wallet/history`)

O ledger registra todas as operações que passam pelos backends:
- Depósitos (via webhook Eulen → Laravel)
- Saques (via notificação Python → Laravel)

#### Conteúdo Final

| Dado | Fonte | Observação |
|------|-------|------------|
| Lista de transações | `useTransactions(filters)` | REAL — já religado |
| Total recebido | Agregação frontend | Calculado |
| Total enviado | Agregação frontend | Calculado |
| Contagem | `meta.total` | REAL |

#### Anatomia por Transação

**Linha principal:**
```
┌─────────────────────────────────────────────────────────────┐
│ [↓ Depósito] [●] R$ 500,00         Concluído    06/08 14:30 │
└─────────────────────────────────────────────────────────────┘
```

**Expansível (ao clicar):**
```
┌─────────────────────────────────────────────────────────────┐
│ Detalhes da transação                                       │
├─────────────────────────────────────────────────────────────┤
│ Bruto:     R$ 500,00                                        │
│ Taxa:      R$ 5,00                                          │
│ Líquido:   R$ 495,00 (depósitos)                            │
├─────────────────────────────────────────────────────────────┤
│ ID: abc123-def456-...  [Copiar]                             │
│ Endereço Liquid: lq1qq...xyz  [Copiar]  (só saques)         │
│ E2E: E00000000202X...  [Copiar]  (só saques concluídos)     │
│ Pagador: João da Silva  (só depósitos)                      │
│ CPF: ***123.456-**  (só depósitos)                          │
├─────────────────────────────────────────────────────────────┤
│ [Ver comprovante]  (se receiptUrl disponível)               │
└─────────────────────────────────────────────────────────────┘
```

#### Status já implementado (sessão 13)

- Lista carrega dados reais da API
- Filtros Todas/Entradas/Saídas funcionam
- Paginação funciona
- Estados loading/vazio/erro implementados
- Campos expandíveis com E2E, payerName, receiptUrl

---

### A.5 Wallet (Carteira Liquid)

**Caminho:** `(main)/wallet/page.tsx` (NOVO)

**Substitui:** `pix-keys/page.tsx`

#### Propósito

Gestão do endereço Liquid do usuário. Este endereço é usado para:
1. Receber DePix de depósitos (Eulen envia direto para a carteira do usuário via split)
2. Identificação para futuras funcionalidades

#### Conteúdo Final

| Dado | Fonte | Observação |
|------|-------|------------|
| Endereço Liquid atual | `GET /v1/wallet/liquid-address` | **BACKEND NOVO** |
| Label do endereço | `GET /v1/wallet/liquid-address` | **BACKEND NOVO** |
| Data de cadastro | `GET /v1/wallet/liquid-address` | **BACKEND NOVO** |
| Pode alterar? | `can_update` | Trava de 24h |

#### Anatomia

```
┌─────────────────────────────────────────────────────────────┐
│ Carteira                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Seu endereço para receber DePix:                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ lq1qqxyz123abc456def789...                    [Copiar]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Label: Minha carteira principal                             │
│ Cadastrado em: 06/08/2026                                   │
│                                                             │
│ [Alterar endereço]                                          │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ ⚠️ ATENÇÃO: Este é um endereço da rede Liquid.              │
│ NÃO envie Bitcoin (BTC) para este endereço — os fundos      │
│ seriam perdidos permanentemente.                            │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Sobre endereços Liquid:                                     │
│ • Endereços começam com "lq1" ou "ex1"                      │
│ • Usados exclusivamente para DePix (Liquid Network)         │
│ • Transações são confirmadas em ~1 minuto                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Fluxo de Alteração

1. Usuário clica "Alterar endereço"
2. Modal abre com input para novo endereço
3. Validação frontend: prefixo `lq1` ou `ex1`, comprimento mínimo
4. Backend envia código de verificação por e-mail
5. Usuário digita código (6 dígitos, expira em 10 min)
6. Endereço alterado
7. E-mail de notificação enviado
8. **Trava de 24h:** Próxima alteração só após 24 horas

#### Estados

| Estado | Implementação |
|--------|---------------|
| Sem endereço | CTA grande "Cadastrar carteira" + aviso que depósitos exigem carteira |
| Com endereço | Exibição + botão alterar |
| Loading | Skeleton |
| Erro | Card de erro com retry |
| Trava ativa | Botão "Alterar" desabilitado + texto "Aguarde X horas" |

---

### A.6 Settings (Ajustes)

**Caminho:** `(main)/settings/page.tsx`

#### Conteúdo Final

| Dado | Fonte | Observação |
|------|-------|------------|
| Status 2FA | `useAuthStore` → `user.twoFactorEnabled` | REAL |
| Dados da empresa | **REMOVER** | Mock sem backend |
| Notificações | **REMOVER** | Mock sem backend |
| Aparência | **REMOVER** | Mock sem backend |

#### Layout v1 Simplificado

Manter apenas a aba de segurança (2FA, dispositivos, senha).

---

### A.7 Auth (Login/Register/Forgot/Verify)

**Caminho:** `(auth)/*`

Todas as telas de autenticação estão **100% funcionais** e não requerem alterações de integração.

**Único ajuste:** Remover "Entrar com biometria" do login (não implementado).

---

## B. Mapa de Religação

### B.1 Correção Arquitetural — Fluxo de Dinheiro

#### Problema Atual

```
┌─────────────┐     ┌───────────────────┐     ┌─────────┐
│ receive.tsx │────▶│ /api/pix2depix/*  │────▶│  Eulen  │
│  send.tsx   │     │  (proxy Next.js)  │     │ (direto)│
└─────────────┘     └───────────────────┘     └─────────┘
                              │
                              │ ❌ PULA O LARAVEL
                              │ ❌ SEM AUDITORIA
                              │ ❌ SEM SPLIT
                              ▼
                    ┌───────────────────┐
                    │  api/ (Laravel)   │  ← Ignorado!
                    └───────────────────┘
```

#### Solução v1

```
DEPÓSITO:
┌─────────────┐     ┌───────────────────┐     ┌─────────┐
│ receive.tsx │────▶│   /v1/deposits    │────▶│  Eulen  │
└─────────────┘     │   (Laravel)       │     │ (split) │
                    └───────────────────┘     └─────────┘
                              │                    │
                              │ ✅ REGISTRA LEDGER │
                              ▼                    ▼
                    ┌───────────────────┐  ┌─────────────────┐
                    │    Ledger         │  │ Carteira usuário│
                    │  (contabilidade)  │  │    (DePix)      │
                    └───────────────────┘  └─────────────────┘

SAQUE:
┌─────────────┐     ┌───────────────────┐     ┌────────────────┐     ┌─────────┐
│  send.tsx   │────▶│  /v1/withdrawals  │────▶│ flyerx-backend │────▶│  Eulen  │
└─────────────┘     │    (Laravel)      │     │   (Python)     │     │  (PIX)  │
                    └───────────────────┘     └────────────────┘     └─────────┘
                              │                      │
                              │ ✅ REGISTRA LEDGER   │ ✅ RETÉM TAXA
```

### B.2 Plano de Religação — Receive

| Etapa | Atual | Novo |
|-------|-------|------|
| Hook de criação | `useCreatePix2DepixDeposit()` | `useCreateDeposit()` |
| Endpoint | `/api/pix2depix/deposit` | `/v1/deposits` |
| Response: QR | `qrCopyPaste`, `qrImageUrl` | `pixCopyPaste`, `qrCodeUrl` |
| Hook de polling | `usePix2DepixDepositStatus()` | `useDeposit(id)` |

**Pré-requisito:** Usuário deve ter `liquid_address` cadastrado.

### B.3 Plano de Religação — Send

| Etapa | Atual | Novo |
|-------|-------|------|
| Hook de criação | `useCreatePix2DepixWithdraw()` | `useCreateWithdrawal()` |
| Endpoint | `/api/pix2depix/withdraw` | `/v1/withdrawals` |
| Response | `depositAddress` (Eulen) | `flyerx_address` (Python via Laravel) |
| Hook de polling | Criar `useWithdrawal(id)` | `/v1/withdrawals/{id}` |

**Comportamento do usuário:** Idêntico (enviar DePix para endereço Liquid).

### B.4 Tabela das 23 Funções Órfãs/Semi-órfãs

| # | Função | Status Atual | Destino v1 |
|---|--------|--------------|------------|
| **wallet.ts** |
| 1 | `getWallet` | Usada | Manter |
| 2 | `getBalance` | Usada | **REMOVER** (não há saldo BRL) |
| 3 | `listTransactions` | Usada | Manter |
| 4 | `getTransaction` | Semi-órfã | **RELIGAR** em history (expandir) |
| **deposits.ts** |
| 7 | `createDeposit` | Semi-órfã | **RELIGAR** em receive |
| 8 | `getDeposit` | Semi-órfã | **RELIGAR** em receive (polling) |
| **withdrawals.ts** |
| 11 | `estimateWithdrawalFee` | Semi-órfã | **RELIGAR** em send |
| 12 | `createWithdrawal` | Semi-órfã | **RELIGAR** em send |
| 13 | `getWithdrawal` | Órfã | **CRIAR HOOK** + religar em send |
| **pix2depix.ts** |
| 17-20 | `*Pix2Depix*` | Usada | **DESCONTINUAR** (via Laravel) |
| 22 | `isValidLiquidAddress` | Usada | Manter (validação Wallet) |

---

## C. Backend Novo

### C.1 Endpoints de Carteira Liquid

**Escopo fechado:** Apenas o necessário para gestão de endereço Liquid do usuário.

#### Endpoints

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `GET` | `/v1/wallet/liquid-address` | Consultar endereço atual |
| `PUT` | `/v1/wallet/liquid-address` | Atualizar/cadastrar endereço |

#### Tabela

```sql
ALTER TABLE wallets
ADD COLUMN liquid_address VARCHAR(100) NULL,
ADD COLUMN liquid_address_label VARCHAR(50) NULL,
ADD COLUMN liquid_address_updated_at TIMESTAMP NULL;
```

#### Contratos

**GET /v1/wallet/liquid-address**

Response 200 (com endereço):
```json
{
  "success": true,
  "data": {
    "liquid_address": "lq1qqxyz...",
    "label": "Minha carteira principal",
    "updated_at": "2026-08-06T14:30:00Z",
    "can_update": true,
    "next_update_allowed_at": null
  }
}
```

Response 200 (sem endereço):
```json
{
  "success": true,
  "data": null
}
```

**PUT /v1/wallet/liquid-address**

Step 1 — Solicitar código:
```json
{
  "liquid_address": "lq1qqnewaddress...",
  "label": "Nova carteira"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "verification_required": true,
    "message": "Código de verificação enviado para seu e-mail"
  }
}
```

Step 2 — Confirmar com código:
```json
{
  "liquid_address": "lq1qqnewaddress...",
  "label": "Nova carteira",
  "verification_code": "123456"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "liquid_address": "lq1qqnewaddress...",
    "label": "Nova carteira",
    "updated_at": "2026-08-06T15:00:00Z",
    "can_update": false,
    "next_update_allowed_at": "2026-08-07T15:00:00Z"
  }
}
```

#### Validações

| Regra | Implementação |
|-------|---------------|
| Prefixo válido | `^(lq1|ex1)` |
| Comprimento mínimo | 40 caracteres |
| Trava de 24h | `liquid_address_updated_at + 24h > now()` |
| Código de e-mail | 6 dígitos, expira em 10 min |

### C.2 Ajuste no Endpoint de Depósito

O `POST /v1/deposits` deve:

1. Verificar se usuário tem `liquid_address` cadastrado
2. Se não tiver, retornar erro 400: "Cadastre sua carteira Liquid antes de criar depósitos"
3. Se tiver, chamar Eulen `/deposit` com:
   - `depixAddress` = `wallet.liquid_address` (carteira do usuário)
   - `depixSplitAddress` = carteira Flyerx (config)
   - `splitFee` = taxa percentual Flyerx (config)

---

## D. Pipeline de Registro

### D.1 Como Depósitos Entram no Ledger

```
┌─────────────────────────────────────────────────────────────────────┐
│ PIPELINE: DEPÓSITO                                                   │
└─────────────────────────────────────────────────────────────────────┘

1. POST /v1/deposits (Laravel)
   └─→ Cria registro em `deposits` com status=PENDING
   └─→ Chama Eulen /deposit com split
   └─→ Retorna QR Code para frontend

2. Webhook Eulen (POST /webhooks/eulen)
   └─→ Recebe evento de mudança de status
   └─→ Atualiza registro em `deposits`
   └─→ Se status=depix_sent:
       └─→ Cria entrada no LEDGER:
           - type: deposit
           - amount: valor bruto
           - fee: taxa Flyerx (já retida na origem)
           - net_amount: valor líquido (entregue ao usuário)
           - provider_tx_id: blockchainTxID
           - provider_data: { payerName, payerTaxNumber, ... }

3. Frontend (polling)
   └─→ GET /v1/deposits/{id}
   └─→ Exibe status atualizado
```

### D.2 Como Saques Entram no Ledger

```
┌─────────────────────────────────────────────────────────────────────┐
│ PIPELINE: SAQUE                                                      │
└─────────────────────────────────────────────────────────────────────┘

1. POST /v1/withdrawals (Laravel)
   └─→ Cria registro em `withdrawals` com status=PENDING
   └─→ Chama Python /internal/withdrawals
   └─→ Retorna flyerx_address para frontend

2. Worker Python (a cada 30s)
   └─→ Detecta DePix recebido
   └─→ Processa envio para Eulen
   └─→ Atualiza status interno

3. Polling Laravel → Python (a cada 5 min)
   └─→ GET /internal/withdrawals/{id}/status
   └─→ Atualiza registro em `withdrawals`
   └─→ Se status=completed:
       └─→ Cria entrada no LEDGER:
           - type: withdrawal
           - amount: valor solicitado (PIX)
           - fee: taxas totais (Eulen + Flyerx)
           - gross_amount: total DePix enviado pelo usuário
           - provider_tx_id: blockchainTxID
           - end_to_end_id: E2E do PIX
           - receipt_url: comprovante

4. Frontend (polling)
   └─→ GET /v1/withdrawals/{id}
   └─→ Exibe status atualizado
```

### D.3 Mecanismo de Sincronização

**Opção escolhida:** Laravel faz polling do Python (mais simples dado o código existente).

O Laravel já tem scheduler (`flyerx:sync-withdrawals`) que roda a cada 5 minutos. Ajustar para:

1. Buscar saques com status não-terminal
2. Para cada um, chamar Python `GET /internal/withdrawals/{id}/status`
3. Atualizar status local
4. Se status mudou para terminal, registrar no ledger

---

## E. Navegação v1

### E.1 Menu Sidebar

| Posição | Item | Ícone | Rota |
|---------|------|-------|------|
| 1 | **Início** | Home | `/dashboard` |
| 2 | **Receber** | ArrowDownLeft | `/receive` |
| 3 | **Enviar** | ArrowUpRight | `/send` |
| 4 | **Extrato** | FileText | `/history` |
| 5 | **Carteira** | Wallet | `/wallet` |
| 6 | **Ajustes** | Settings | `/settings` |

### E.2 Itens Removidos do Menu

| Item | Motivo |
|------|--------|
| Chaves PIX | Substituído por Carteira |
| Links de Pagamento | Sem backend — pós-v1 |
| Subcontas | Sem backend — pós-v1 |
| Desenvolvedores | Sem backend — pós-v1 |

---

## F. Fila de Execução

### Ordem por Dependências

```
┌─────────────────────────────────────────────────────────────────────┐
│ GRUPO 1: Carteira (DESBLOQUEIA tudo)                                 │
│ ├─→ Backend: endpoints /v1/wallet/liquid-address                     │
│ └─→ Frontend: tela /wallet                                           │
│                                                                      │
│ CRITÉRIO: Usuário consegue cadastrar/alterar endereço Liquid         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ GRUPO 2: Depósito (DEPENDE de Carteira)                              │
│ ├─→ Backend: ajustar /v1/deposits para usar split + liquid_address   │
│ └─→ Frontend: religar receive.tsx                                    │
│                                                                      │
│ CRITÉRIO: Depósito real com dinheiro mínimo, DePix chega na carteira │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ GRUPO 3: Saque (backend INTACTO, só frontend)                        │
│ └─→ Frontend: religar send.tsx com steps, avisos, breakdown          │
│                                                                      │
│ CRITÉRIO: Saque real com dinheiro mínimo, PIX chega no beneficiário  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ GRUPO 4: Pipeline de Registro + History                              │
│ ├─→ Backend: garantir ledger recebe depósitos e saques               │
│ └─→ Frontend: ajustar fonte do history se necessário                 │
│                                                                      │
│ CRITÉRIO: History mostra depósito e saque do teste anterior          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ GRUPO 5: Dashboard + Settings + Polish                               │
│ ├─→ Dashboard: remover saldo, exibir carteira, quick actions         │
│ ├─→ Settings: remover abas mock                                      │
│ └─→ Estados globais: loading, erro em todas as telas                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Detalhamento por Grupo

#### Grupo 1: Carteira

**Tipo:** Backend novo + tela nova
**Bloqueador:** Sim (desbloqueia depósito)

| Item | Responsável | Escopo |
|------|-------------|--------|
| Migration | Backend | Adicionar campos `liquid_address*` em `wallets` |
| GET endpoint | Backend | Consultar endereço atual |
| PUT endpoint | Backend | Atualizar com verificação por e-mail |
| Tela wallet | Frontend | Nova página com cadastro/alteração |
| Hook useLiquidAddress | Frontend | Criar em use-queries.ts |

**Critério de aprovação:**
- [ ] GET retorna endereço ou null
- [ ] PUT exige código de e-mail
- [ ] PUT aplica trava de 24h
- [ ] Tela exibe endereço cadastrado
- [ ] Tela permite alteração com verificação
- [ ] Aviso de Bitcoin visível

#### Grupo 2: Depósito

**Tipo:** Ajuste backend + religação frontend
**Depende de:** Grupo 1

| Item | Responsável | Escopo |
|------|-------------|--------|
| Ajustar /v1/deposits | Backend | Verificar liquid_address, chamar Eulen com split |
| Religar receive | Frontend | Trocar hooks, mapear campos |
| Bloqueio UX | Frontend | Se sem carteira, bloquear e direcionar para /wallet |

**Critério de aprovação:**
- [ ] Depósito com dinheiro real mínimo
- [ ] DePix chega na carteira do usuário (não na Flyerx)
- [ ] Taxa chega na carteira Flyerx
- [ ] Webhook registra no ledger

#### Grupo 3: Saque

**Tipo:** Religação frontend (backend Python intacto)

| Item | Responsável | Escopo |
|------|-------------|--------|
| Hook useCreateWithdrawal | Frontend | Religar para /v1/withdrawals |
| Hook useWithdrawal | Frontend | Criar para polling |
| Tela send | Frontend | Steps, avisos, breakdown |

**Critério de aprovação:**
- [ ] Saque com dinheiro real mínimo
- [ ] Endereço Liquid exibido com QR
- [ ] Valor total (com taxas) destacado
- [ ] Avisos de valor exato e expiração visíveis
- [ ] PIX chega no beneficiário
- [ ] E2E e comprovante exibidos

#### Grupo 4: Pipeline de Registro

**Tipo:** Verificação + ajuste

| Item | Responsável | Escopo |
|------|-------------|--------|
| Verificar webhook depósito | Backend | Confirmar que ledger recebe entry |
| Verificar sync saque | Backend | Confirmar polling Python → ledger |
| Ajustar fonte history | Frontend | Se necessário |

**Critério de aprovação:**
- [ ] History mostra depósito do Grupo 2
- [ ] History mostra saque do Grupo 3
- [ ] Valores bruto/taxa/líquido corretos

#### Grupo 5: Polish

**Tipo:** Simplificação + estados

| Item | Responsável | Escopo |
|------|-------------|--------|
| Dashboard | Frontend | Remover saldo, exibir carteira |
| Settings | Frontend | Remover abas mock |
| Estados | Frontend | Loading/erro em todas as telas |
| Sidebar | Frontend | Atualizar menu |

---

## G. Pré-Go-Live

### G.1 Checklist Obrigatório

Estes itens são **BLOQUEADORES** para produção com dinheiro real:

| # | Item | Risco se Ausente | Status |
|---|------|------------------|--------|
| 1 | **MED Handler** | Saldo negativo, prejuízo | Pendente |
| 2 | **Assinatura de Webhook** | Webhooks forjados | Pendente |
| 3 | **LWK_MNEMONIC no vault** | Exposição de chave privada | Pendente |
| 4 | **Retry/alertas do plano LWK** | Saque falho sem aviso | Verificar |
| 5 | **Smoke test com dinheiro real** | Fluxo quebrado em prod | Por fazer |

### G.2 MED Handler

O webhook MED (Mecanismo Especial de Devolução) da Eulen **NÃO é tratado** atualmente.

**Risco:**
1. Depósito confirmado, DePix entregue ao usuário
2. Usuário pode ter convertido/sacado
3. 30-90 dias depois: MED acionado (fraude no PIX original)
4. Eulen estorna da conta Flyerx
5. Flyerx assume prejuízo

**Implementação mínima:**
```php
// WebhookController.php
case 'med':
    // 1. Localizar depósito pelo bankTxId
    // 2. Registrar evento MED no ledger
    // 3. Enviar alerta para admin
    // 4. Bloquear usuário para análise
    break;
```

### G.3 Assinatura de Webhook

Em `config/eulen.php`:
```php
'validate_signature' => env('EULEN_VALIDATE_WEBHOOK_SIGNATURE', false),
```

**Para produção:** Definir `EULEN_VALIDATE_WEBHOOK_SIGNATURE=true` e configurar secret.

### G.4 LWK_MNEMONIC

Atualmente em `.env`:
```
LWK_MNEMONIC=your mnemonic words here
```

**Para produção:** Migrar para vault seguro (AWS Secrets Manager, HashiCorp Vault, etc).

### G.5 Smoke Test

Antes de abrir para usuários:

1. **Depósito mínimo (R$ 10)**
   - Criar QR Code
   - Pagar via PIX real
   - Verificar DePix na carteira de teste
   - Verificar taxa na carteira Flyerx

2. **Saque mínimo (R$ 10)**
   - Criar saque
   - Enviar DePix do valor exato
   - Verificar PIX na conta destino
   - Verificar E2E e comprovante

3. **History**
   - Verificar ambas operações no extrato
   - Verificar valores bruto/taxa/líquido

---

## H. Registros Pós-v1

### H.1 Funcionalidades Adiadas

| Item | Descrição | Impacto |
|------|-----------|---------|
| Limites dinâmicos | Chamar `/user-info` da Eulen | UX — limites mais precisos |
| Exportar CSV/PDF | Implementar export | UX — auditoria do usuário |
| Múltiplas carteiras | Array de endereços Liquid | UX — flexibilidade |
| Links de Pagamento | Backend + tela | Negócio — nova feature |
| Subcontas | Backend + tela | Negócio — nova feature |
| Desenvolvedores | API keys + webhooks | Negócio — integrações |
| QR Delay | Usar `delayDepixInHours` | Segurança — janela MED |

### H.2 Telas Escondidas v1

| Tela | Rota | Ação |
|------|------|------|
| payment-links | `/payment-links` | Remover do menu, código permanece |
| subaccounts | `/subaccounts` | Remover do menu, código permanece |
| developers | `/developers` | Remover do menu, código permanece |

---

## I. Estado Real vs. Planejado (Arqueologia 2026-08-07)

> **NOTA:** Esta seção foi adicionada após verificação do código real. O planejado acima permanece como **meta**, esta seção documenta o **estado atual**.

### I.1 Discrepâncias Críticas

| Item Planejado | Estado Real | Gap |
|----------------|-------------|-----|
| Depósito via Laravel com split | Depósito via Eulen direto SEM split | 🔴 Taxa Flyerx não cobrada |
| Carteira no backend | Carteira em localStorage | 🔴 Perda de dados ao trocar device |
| Saque via Laravel → Python | Saque via Python direto | 🟡 Funciona mas sem auditoria |
| Ledger registra operações | Nada registrado no ledger | 🔴 History vazio |
| Credenciais server-side | Tokens em NEXT_PUBLIC | 🔴 Exposição de credenciais |

### I.2 O Que Funciona

- ✅ History religado à API Laravel (sessão 13)
- ✅ UI de receive/send redesenhada (sessão 15)
- ✅ Saque cobra taxa de parceiro via Python/LWK
- ✅ Limite diário consultado do Python
- ✅ Polling de status funciona

### I.3 Fila Recalculada

A fila original (seção F) permanece como **meta**. O progresso real é:

| Grupo Original | Status Real | Próxima Ação |
|----------------|-------------|--------------|
| 1. Carteira | ❌ Não iniciado | **BLOQUEADOR** — criar endpoints no Laravel |
| 2. Depósito | ❌ Não iniciado | Aguarda Carteira |
| 3. Saque | ⚠️ Parcial (usa Python direto) | Rotear via Laravel |
| 4. Pipeline | ❌ Não iniciado | Aguarda 2 e 3 |
| 5. Polish | ❌ Bloqueado | Aguarda 4 |

### I.4 Riscos Imediatos

| Risco | Impacto | Mitigação Sugerida |
|-------|---------|-------------------|
| Taxa não cobrada em depósitos | Receita zero | Priorizar split no receive |
| Tokens expostos | Segurança comprometida | Mover para API routes server-only |
| History vazio | UX quebrada | Acelerar pipeline de registro |

---

## Changelog

| Data | Autor | Descrição |
|------|-------|-----------|
| 2026-08-06 | Claude | Documento inicial — Passo 2 Fase 6 |
| 2026-08-06 | Claude | **Passo 2.5** — Correção arquitetural: modelo não-custodial, spec send com 9 status Python, spec receive com split, pipeline de registro, pré-go-live consolidado |
| 2026-08-07 | Claude | **Seção I** — Arqueologia: estado real vs. planejado, discrepâncias críticas, fila recalculada |

---

*Documento gerado como parte do Passo 2.5 da Fase 6 — Arquitetura Definitiva de Integração.*
*Atualizado em 2026-08-07 com seção I (Arqueologia).*
