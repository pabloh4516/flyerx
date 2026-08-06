# Decisões de Conteúdo e Integração — Flyerx Web v1

**Gerado em:** 2026-08-06
**Fase:** 6, Passo 2
**Status:** Decisões aprovadas pelo usuário — pronto para execução

---

## Índice

- [A. Spec por Tela v1](#a-spec-por-tela-v1)
- [B. Mapa de Religação](#b-mapa-de-religação)
- [C. Backend Novo](#c-backend-novo)
- [D. Navegação v1](#d-navegação-v1)
- [E. Fila de Execução](#e-fila-de-execução)
- [F. Registros Pós-v1](#f-registros-pós-v1)

---

## A. Spec por Tela v1

### A.1 Dashboard

**Caminho:** `(main)/dashboard/page.tsx`

#### Conteúdo Final

| Dado | Fonte | Observação |
|------|-------|------------|
| Nome do usuário | `useAuthStore` → `user.name` | ✅ REAL — manter |
| Nível de verificação | `useAuthStore` → `user.kycLevel` | ✅ REAL — manter |
| Saldo disponível | `useBalance()` → `/v1/wallet/balance` | ✅ REAL — manter |
| Transações recentes (3) | `useTransactions()` → `/v1/wallet/history` | ✅ REAL — manter |
| Entradas/Saídas do dia | **REMOVER** | Mock hardcoded — sem endpoint de agregação |
| + esta semana | **REMOVER** | Mock hardcoded — sem endpoint |
| Chaves cadastradas | **REMOVER** | Mock — funcionalidade pós-v1 |
| Pagamentos da semana | **REMOVER** | Mock — sem endpoint |
| Sparkline (gráfico) | **REMOVER** | Mock — dados fictícios |
| Saudação (Bom dia) | `Date` local | ✅ DERIVADO — manter |
| Data atual | `Date` local | ✅ DERIVADO — manter |

#### Layout v1 Simplificado

```
┌─────────────────────────────────────────────────┐
│ Saudação + Data                                 │
├─────────────────────────────────────────────────┤
│ Card: Saldo disponível                          │
│       R$ X.XXX,XX                               │
│       [Copiar link PIX]                         │
├─────────────────────────────────────────────────┤
│ Quick Actions: Receber | Enviar | Extrato | ... │
├─────────────────────────────────────────────────┤
│ Últimas transações (3)                          │
│ └─ [Ver extrato completo →]                     │
└─────────────────────────────────────────────────┘
```

#### Estados a Tratar

| Estado | Implementação |
|--------|---------------|
| Loading | Skeleton para saldo e transações |
| Vazio (transações) | EmptyState existente — manter |
| Erro (API) | Card de erro com retry button |

#### Botões/Ações

| Elemento | Destino v1 |
|----------|------------|
| Copiar link PIX | ✅ Funcional — manter |
| Ver extrato | ✅ Link `/history` — manter |
| Quick Actions | ✅ Links funcionais — manter |
| Filtros Tudo/Entradas/Saídas | **REMOVER** — decorativo |
| Botão QR | **REMOVER** — sem onClick |

#### Status de Transação

| Status API | Badge | Cor |
|------------|-------|-----|
| `COMPLETED` | Concluído | success (verde) |
| `PENDING` | Pendente | warning (amarelo) |
| `PROCESSING` | Processando | warning (amarelo) |
| `FAILED` | Falhou | error (vermelho) |
| `CANCELLED` | Cancelado | neutral |
| `EXPIRED` | Expirado | neutral |

**Oportunidade incorporada:** `payerName` na lista de transações (quando disponível no response).

---

### A.2 Receive (Receber PIX)

**Caminho:** `(main)/receive/page.tsx`

#### Correção Arquitetural

**ANTES (problemático):**
```
receive/page.tsx
    └─→ useCreatePix2DepixDeposit()
        └─→ lib/api/pix2depix.ts
            └─→ /api/pix2depix/deposit (proxy Next.js)
                └─→ Eulen /deposit (DIRETO)
```

**DEPOIS (correto):**
```
receive/page.tsx
    └─→ useCreateDeposit()
        └─→ lib/api/deposits.ts
            └─→ /v1/deposits (Laravel)
                └─→ Laravel chama Eulen internamente
                └─→ Webhook atualiza status
```

#### Conteúdo Final

| Dado | Fonte | Observação |
|------|-------|------------|
| Limites (min/max) | `useFeesStore` → config local | ✅ Manter (pós-v1: `/user-info`) |
| Taxas | `useFeesStore` → config local | ✅ Manter |
| QR Code (imagem) | `useCreateDeposit()` → `qrCodeUrl` | Religação |
| Código copia e cola | `useCreateDeposit()` → `pixCopyPaste` | Religação |
| Status do depósito | `useDeposit(id)` → polling | Religação |
| Countdown expiração | `expiresAt` do response | **REAL** — implementar countdown |
| Valor líquido | Calculado: `amount - fee` | ✅ DERIVADO |

#### Mapeamento de Campos

| Fluxo Atual (Eulen) | Fluxo Novo (Laravel) |
|---------------------|----------------------|
| `qrCopyPaste` | `pixCopyPaste` |
| `qrImageUrl` | `qrCodeUrl` |
| `status` (Eulen enum) | `status` (Laravel enum) |
| `expiration` | `expiresAt` |

#### Estados a Tratar

| Estado | Implementação |
|--------|---------------|
| Loading (submit) | Loader no botão — manter |
| Loading (QR) | Skeleton enquanto gera |
| Sucesso | Tela com QR + countdown |
| Expirado | Card "QR expirado" + botão Novo PIX |
| Erro | Toast + card de erro |

#### Status Especiais (Eulen não distinguidos → distinguir)

| Status Eulen | Status Laravel | Mensagem ao Usuário |
|--------------|----------------|---------------------|
| `pending` | `PENDING` | "Aguardando pagamento" |
| `under_review` | `PROCESSING` | "Em análise de segurança" |
| `delayed` | `PROCESSING` | "Processando (pode levar até X horas)" |
| `approved` | `PROCESSING` | "Pagamento confirmado, processando" |
| `depix_sent` | `COMPLETED` | "Depósito concluído!" |
| `will_refund` | `CANCELLED` | "Pagamento será devolvido" |
| `refunded` | `CANCELLED` | "Pagamento devolvido ao pagador" |
| `expired` | `EXPIRED` | "QR Code expirou" |
| `error` | `FAILED` | "Erro no processamento" |

#### Botões/Ações

| Elemento | Destino v1 |
|----------|------------|
| Gerar QR Code | ✅ Religação para Laravel |
| Copiar código | ✅ Funcional — manter |
| Novo PIX | ✅ Reset estado — manter |
| Ver extrato | ✅ Link `/history` — manter |
| Voltar ao início | ✅ Link `/dashboard` — manter |
| Atualizar | **REMOVER** — polling automático |
| Ajuda (?) | **REMOVER** — sem conteúdo |
| Config (⚙) | **REMOVER** — sem função |

#### Oportunidades Incorporadas

- **Countdown real:** Usar `expiresAt` para countdown decrescente
- **payerName:** Exibir após confirmação "Pagamento de [Nome]"
- **payerTaxNumber:** Exibir mascarado após confirmação

---

### A.3 Send (Enviar PIX)

**Caminho:** `(main)/send/page.tsx`

#### Correção Arquitetural — MUDANÇA DE PARADIGMA

**ANTES (fluxo Eulen direto):**
1. Usuário informa chave PIX e valor
2. Sistema gera endereço Liquid
3. Usuário envia DePix de sua carteira externa
4. Eulen detecta DePix e envia PIX

**DEPOIS (fluxo Laravel):**
1. Usuário informa chave PIX e valor
2. Sistema debita saldo interno da carteira
3. Laravel/LWK envia PIX automaticamente
4. Usuário acompanha status

**Implicação:** A tela send v1 **não precisa** de endereço Liquid. O saque é feito do saldo interno.

#### Conteúdo Final

| Dado | Fonte | Observação |
|------|-------|------------|
| Saldo disponível | `useBalance()` | Mostrar para validação |
| Limites (min/max) | `useFeesStore` → config | ✅ Manter |
| Taxa estimada | `useEstimateFee(amount)` → `/v1/withdrawals/estimate-fee` | Religação |
| Status do saque | `useWithdrawal(id)` ou polling | Religação |
| E2E ID | `end_to_end_id` do response | **NOVO** — exibir |
| receiptUrl | `receiptUrl` do response | **NOVO** — link comprovante |

#### Anatomia v1 — Steps Verticais

```
┌─────────────────────────────────────────────────┐
│ Step 1: Informar Chave PIX                      │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Input] Chave PIX                           │ │
│ │ [Select] Tipo: CPF | CNPJ | Email | ...     │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Step 2: Valor                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ [AmountInput] R$ ____                       │ │
│ │ Saldo disponível: R$ X.XXX,XX               │ │
│ │ Taxa: R$ X,XX                               │ │
│ │ Você receberá: R$ X.XXX,XX                  │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Step 3: Confirmação                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ ⚠️ AVISO: Verifique a chave PIX!            │ │
│ │ Transferências para chaves erradas são      │ │
│ │ irreversíveis. Fundos não podem ser         │ │
│ │ recuperados.                                │ │
│ │                                             │ │
│ │ [ ] Confirmo que a chave PIX está correta   │ │
│ │                                             │ │
│ │ [Confirmar e Enviar]                        │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Step 4: Acompanhamento                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ Status: ● Enviando PIX...                   │ │
│ │ Valor: R$ X.XXX,XX  [Copiar]                │ │
│ │ Chave: ***email@***                         │ │
│ │ Taxa: R$ X,XX                               │ │
│ │                                             │ │
│ │ ✓ Concluído!                                │ │
│ │ E2E: XXXXXXXXX  [Copiar]                    │ │
│ │ [Ver comprovante]                           │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

#### Status do Saque

| Status Laravel | Status Visual | Ícone |
|----------------|---------------|-------|
| `pending` | Aguardando | ◐ spinner |
| `approved` | Aprovado | ✓ |
| `processing` | Enviando PIX | ◐ spinner |
| `completed` | Concluído | ✓ verde |
| `failed` | Falhou | ✗ vermelho |
| `cancelled` | Cancelado | — |
| `rejected` | Rejeitado | ✗ vermelho |
| `refunded` | Devolvido | ↩ |

#### Avisos de Perda Irreversível

**Aviso inline (antes do botão):**
> ⚠️ **Atenção:** Transferências PIX são instantâneas e irreversíveis. Verifique a chave de destino com cuidado.

**Modal de confirmação (ao clicar Confirmar):**
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Confirmar Transferência                      │
├─────────────────────────────────────────────────┤
│ Você está enviando:                             │
│                                                 │
│ R$ 1.000,00                                     │
│ Para: email@exemplo.com (EMAIL)                 │
│ Taxa: R$ 10,00                                  │
│                                                 │
│ [ ] Confirmo que a chave PIX está correta e    │
│     entendo que não posso reverter esta        │
│     transferência.                              │
│                                                 │
│ [Cancelar]              [Confirmar Envio]       │
└─────────────────────────────────────────────────┘
```

#### Botões/Ações

| Elemento | Destino v1 |
|----------|------------|
| Confirmar e Enviar | ✅ Religação para Laravel |
| Copiar valor | ✅ Funcional |
| Copiar E2E | ✅ NOVO — adicionar |
| Ver comprovante | ✅ NOVO — `receiptUrl` |
| Novo PIX | ✅ Reset estado |
| Ver extrato | ✅ Link `/history` |
| Voltar | ✅ Link `/dashboard` |
| Atualizar | **REMOVER** — polling automático |

#### Oportunidades Incorporadas

- **receiptUrl:** Link "Ver comprovante" quando disponível
- **centralBankId (E2E):** Exibir com botão Copiar
- **receiverName:** Exibir na confirmação se retornado pela validação

---

### A.4 History (Extrato)

**Caminho:** `(main)/history/page.tsx`

#### Integração Prioritária

**ANTES:** `mockTransactions` hardcoded
**DEPOIS:** `useTransactions()` → `/v1/wallet/history`

#### Conteúdo Final

| Dado | Fonte | Observação |
|------|-------|------------|
| Lista de transações | `useTransactions(filters)` | Religação |
| Total recebido | Agregação frontend | Calculado |
| Total enviado | Agregação frontend | Calculado |
| Contagem | `meta.total` da resposta | Religação |

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
│ Taxa:      R$ 0,00                                          │
│ Líquido:   R$ 500,00                                        │
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

#### Filtros v1

| Filtro | Implementação |
|--------|---------------|
| Todas/Entradas/Saídas | ✅ Funcional — `type` filter |
| Busca (ID/descrição) | ✅ Funcional — filter local |
| Filtros avançados | **REMOVER** — decorativo |
| Últimos 30 dias | **REMOVER** — decorativo |
| Exportar | **REMOVER** — decorativo (pós-v1) |
| Paginação | ✅ Implementar — `meta.page`, `meta.totalPages` |

#### Estados a Tratar

| Estado | Implementação |
|--------|---------------|
| Loading | Skeleton rows (5 linhas) |
| Vazio | EmptyState: "Nenhuma transação encontrada" |
| Erro | Card de erro com retry |
| Filtrando | Debounce na busca (300ms) |

#### Oportunidades Incorporadas

- **receiptUrl:** Botão "Ver comprovante"
- **centralBankId (E2E):** Campo copiável
- **payerName/payerTaxNumber:** Exibir em depósitos

---

### A.5 Carteira (Nova Tela)

**Caminho:** `(main)/wallet/page.tsx` (NOVO)

**Substitui:** `pix-keys/page.tsx` (que vira link para esta)

#### Propósito

Gestão do endereço Liquid do usuário para recebimento de DePix externos (fora do sistema Flyerx).

#### Conteúdo Final

| Dado | Fonte | Observação |
|------|-------|------------|
| Endereço Liquid atual | `GET /v1/wallet/liquid-address` | **BACKEND NOVO** |
| Label do endereço | `GET /v1/wallet/liquid-address` | **BACKEND NOVO** |
| Data de cadastro | `GET /v1/wallet/liquid-address` | **BACKEND NOVO** |

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
│ seriam perdidos permanentemente e não podem ser             │
│ recuperados.                                                │
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
3. Validação frontend: prefixo `lq1` ou `ex1`, comprimento
4. Usuário confirma
5. Sistema envia código de verificação por e-mail
6. Usuário digita código
7. Endereço alterado
8. E-mail de notificação enviado
9. **Trava de 24h:** Próxima alteração só após 24 horas

#### Estados

| Estado | Implementação |
|--------|---------------|
| Sem endereço | CTA "Cadastrar endereço" |
| Com endereço | Exibição + botão alterar |
| Loading | Skeleton |
| Erro | Card de erro |
| Trava ativa | Botão desabilitado + texto "Aguarde X horas" |

#### Migração do localStorage

1. Ao carregar a tela, verificar `useFeesStore.wallets`
2. Se existe carteira local e backend vazio:
   - Oferecer migração: "Encontramos uma carteira salva localmente. Deseja migrar?"
   - Se sim: `PUT /v1/wallet/liquid-address` com dados locais
3. Após migração bem-sucedida: limpar localStorage
4. `useFeesStore` deixa de ser fonte de verdade para endereço

---

### A.6 Settings (Ajustes)

**Caminho:** `(main)/settings/page.tsx`

#### Conteúdo Final

| Dado | Fonte | Observação |
|------|-------|------------|
| Status 2FA | `useAuthStore` → `user.twoFactorEnabled` | ✅ REAL |
| Dados da empresa | **REMOVER** | Mock sem backend |
| Notificações | **REMOVER** | Mock sem backend |
| Aparência | **REMOVER** | Mock sem backend |

#### Layout v1 Simplificado

Manter apenas a aba de segurança (2FA):

```
┌─────────────────────────────────────────────────────────────┐
│ Ajustes                                                     │
├─────────────────────────────────────────────────────────────┤
│ Segurança                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Autenticação em dois fatores (2FA)                      │ │
│ │ Status: ● Ativado / ○ Desativado                        │ │
│ │ [Gerenciar 2FA →]                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Dispositivos conectados                                 │ │
│ │ [Ver dispositivos →]                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Trocar senha                                            │ │
│ │ [Alterar senha →]                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Botões/Ações

| Elemento | Destino v1 |
|----------|------------|
| Gerenciar 2FA | ✅ Modal com setup/disable |
| Ver dispositivos | ✅ Modal com lista + logout |
| Alterar senha | ✅ Modal com form |
| Tabs (business/notifications/appearance) | **REMOVER** |
| Salvar alterações | **REMOVER** — ações inline |

---

### A.7 Auth (Login/Register/Forgot/Verify)

**Caminho:** `(auth)/*`

#### Status

Todas as telas de autenticação estão **100% funcionais** e não requerem alterações de integração.

#### Único ajuste: Login

| Elemento | Destino v1 |
|----------|------------|
| Entrar com biometria | **REMOVER** — não implementado |

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
                              ▼
                    ┌───────────────────┐
                    │  api/ (Laravel)   │  ← Ignorado!
                    │  - Ledger         │
                    │  - Compliance     │
                    │  - Webhooks       │
                    └───────────────────┘
```

#### Solução

```
┌─────────────┐     ┌───────────────────┐     ┌─────────┐
│ receive.tsx │────▶│   /v1/deposits    │────▶│  Eulen  │
│  send.tsx   │     │   /v1/withdrawals │     │  (via   │
└─────────────┘     │   (Laravel API)   │     │ Laravel)│
                    └───────────────────┘     └─────────┘
                              │
                              │ ✅ TODO FLUXO AUDITADO
                              ▼
                    ┌───────────────────┐
                    │  api/ (Laravel)   │
                    │  - Ledger ✓       │
                    │  - Compliance ✓   │
                    │  - Webhooks ✓     │
                    └───────────────────┘
```

### B.2 Plano de Religação — Receive

| Etapa | Atual | Novo |
|-------|-------|------|
| Hook de criação | `useCreatePix2DepixDeposit()` | `useCreateDeposit()` |
| Função chamada | `createPix2DepixDeposit()` | `createDeposit()` |
| Endpoint | `/api/pix2depix/deposit` | `/v1/deposits` |
| Response: QR | `qrCopyPaste`, `qrImageUrl` | `pixCopyPaste`, `qrCodeUrl` |
| Hook de polling | `usePix2DepixDepositStatus()` | `useDeposit(id)` |
| Função chamada | `getPix2DepixDepositStatus()` | `getDeposit()` |
| Endpoint | `/api/pix2depix/deposit-status` | `/v1/deposits/{id}` |

### B.3 Plano de Religação — Send

| Etapa | Atual | Novo |
|-------|-------|------|
| Hook de criação | `useCreatePix2DepixWithdraw()` | `useCreateWithdrawal()` |
| Função chamada | `createPix2DepixWithdraw()` | `createWithdrawal()` |
| Endpoint | `/api/pix2depix/withdraw` | `/v1/withdrawals` |
| **Response** | `depositAddress` (Liquid) | **Não retorna** — fluxo diferente |
| Hook de polling | `usePix2DepixWithdrawStatus()` | `useWithdrawal(id)` (criar) |
| Função chamada | `getPix2DepixWithdrawStatus()` | `getWithdrawal()` |
| Endpoint | `/api/pix2depix/withdraw-status` | `/v1/withdrawals/{id}` |

**Mudança de paradigma:** O fluxo Laravel debita saldo interno e envia PIX automaticamente. Não há etapa de "enviar DePix".

### B.4 Tabela das 23 Funções Órfãs/Semi-órfãs

| # | Função | Arquivo | Status Atual | Destino v1 |
|---|--------|---------|--------------|------------|
| **wallet.ts** |
| 1 | `getWallet` | wallet.ts | ✅ Usada | Manter |
| 2 | `getBalance` | wallet.ts | ✅ Usada | Manter |
| 3 | `listTransactions` | wallet.ts | ✅ Usada | Manter |
| 4 | `getTransaction` | wallet.ts | ⚠️ Semi-órfã | **RELIGAR** em history (expandir) |
| 5 | `exportTransactionsCsv` | wallet.ts | ❌ Órfã | Pós-v1 |
| 6 | `exportTransactionsPdf` | wallet.ts | ❌ Órfã | Pós-v1 |
| **deposits.ts** |
| 7 | `createDeposit` | deposits.ts | ⚠️ Semi-órfã | **RELIGAR** em receive |
| 8 | `getDeposit` | deposits.ts | ⚠️ Semi-órfã | **RELIGAR** em receive (polling) |
| 9 | `listDeposits` | deposits.ts | ⚠️ Semi-órfã | Pós-v1 (admin) |
| 10 | `cancelDeposit` | deposits.ts | ❌ Órfã | Pós-v1 |
| **withdrawals.ts** |
| 11 | `estimateWithdrawalFee` | withdrawals.ts | ⚠️ Semi-órfã | **RELIGAR** em send |
| 12 | `createWithdrawal` | withdrawals.ts | ⚠️ Semi-órfã | **RELIGAR** em send |
| 13 | `getWithdrawal` | withdrawals.ts | ❌ Órfã | **CRIAR HOOK** + religar em send |
| 14 | `listWithdrawals` | withdrawals.ts | ⚠️ Semi-órfã | **RELIGAR** em history |
| 15 | `cancelWithdrawal` | withdrawals.ts | ❌ Órfã | Pós-v1 |
| 16 | `validatePixKey` | withdrawals.ts | ❌ Órfã | Avaliar uso em send |
| **pix2depix.ts** |
| 17 | `createPix2DepixDeposit` | pix2depix.ts | ✅ Usada | **DESCONTINUAR** |
| 18 | `getPix2DepixDepositStatus` | pix2depix.ts | ✅ Usada | **DESCONTINUAR** |
| 19 | `createPix2DepixWithdraw` | pix2depix.ts | ✅ Usada | **DESCONTINUAR** |
| 20 | `getPix2DepixWithdrawStatus` | pix2depix.ts | ✅ Usada | **DESCONTINUAR** |
| 21 | `getPix2DepixUserInfo` | pix2depix.ts | ⚠️ Semi-órfã | Pós-v1 (limites dinâmicos) |
| 22 | `isValidLiquidAddress` | pix2depix.ts | ✅ Usada | Manter (validação Carteira) |
| 23 | `isValidEUID` | pix2depix.ts | ⚠️ Semi-órfã | Avaliar |

#### Resumo de Ações

| Ação | Quantidade | Funções |
|------|------------|---------|
| **RELIGAR** | 7 | 4, 7, 8, 11, 12, 13, 14 |
| **DESCONTINUAR** | 4 | 17, 18, 19, 20 |
| **PÓS-V1** | 6 | 5, 6, 9, 10, 15, 21 |
| **MANTER** | 4 | 1, 2, 3, 22 |
| **AVALIAR** | 2 | 16, 23 |

---

## C. Backend Novo

### C.1 Backend Novo Autorizado — Carteira Liquid

**Escopo fechado:** Apenas o necessário para gestão de endereço Liquid.

#### Endpoints

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `GET` | `/v1/wallet/liquid-address` | Consultar endereço atual |
| `PUT` | `/v1/wallet/liquid-address` | Atualizar endereço |

#### Tabela

**Alteração em `wallets`:**

```sql
ALTER TABLE wallets
ADD COLUMN liquid_address VARCHAR(100) NULL,
ADD COLUMN liquid_address_label VARCHAR(50) NULL,
ADD COLUMN liquid_address_updated_at TIMESTAMP NULL;
```

#### Request/Response

**GET /v1/wallet/liquid-address**

Response 200:
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

Request (step 1 — solicitar código):
```json
{
  "liquid_address": "lq1qqnewaddress...",
  "label": "Nova carteira"
}
```

Response 200:
```json
{
  "success": true,
  "data": {
    "verification_required": true,
    "message": "Código de verificação enviado para seu e-mail"
  }
}
```

Request (step 2 — confirmar com código):
```json
{
  "liquid_address": "lq1qqnewaddress...",
  "label": "Nova carteira",
  "verification_code": "123456"
}
```

Response 200:
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

#### E-mails

1. **Solicitação de alteração:** "Código de verificação: XXXXXX"
2. **Confirmação de alteração:** "Seu endereço Liquid foi alterado. Se não foi você, entre em contato."

### C.2 Backend Existente Consumido

| Endpoint | Tela | Status |
|----------|------|--------|
| `POST /v1/deposits` | receive | Já existe, religar |
| `GET /v1/deposits/{id}` | receive | Já existe, religar |
| `POST /v1/withdrawals` | send | Já existe, religar |
| `GET /v1/withdrawals/{id}` | send | Já existe, criar hook |
| `POST /v1/withdrawals/estimate-fee` | send | Já existe, religar |
| `GET /v1/wallet/history` | history, dashboard | Já existe, religar |
| `GET /v1/wallet/balance` | dashboard | Já usado |
| `GET /v1/2fa/*` | settings | Já usado |

### C.3 Gaps Identificados

| Gap | Descrição | Ação |
|-----|-----------|------|
| Hook `useWithdrawal` | Não existe hook para `getWithdrawal` | Criar em use-queries.ts |
| Polling de saque | Send precisa polling como receive | Implementar em useWithdrawal |
| Nenhum gap de endpoint | Laravel cobre todo o fluxo v1 | — |

---

## D. Navegação v1

### D.1 Menu Sidebar

| Posição | Item | Ícone | Rota | Observação |
|---------|------|-------|------|------------|
| 1 | **Início** | Home | `/dashboard` | Manter |
| 2 | **Receber** | ArrowDownLeft | `/receive` | Manter |
| 3 | **Enviar** | ArrowUpRight | `/send` | Manter |
| 4 | **Extrato** | FileText | `/history` | Manter |
| 5 | **Carteira** | Wallet | `/wallet` | **NOVO** (substitui Chaves PIX) |
| 6 | **Ajustes** | Settings | `/settings` | Manter |

### D.2 Itens Removidos do Menu

| Item Anterior | Motivo | Código |
|---------------|--------|--------|
| Chaves PIX | Substituído por Carteira | Manter em `(main)/pix-keys/` (redirect) |
| Links de Pagamento | Sem backend — pós-v1 | **ESCONDER** (código permanece) |
| Subcontas | Sem backend — pós-v1 | **ESCONDER** (código permanece) |
| Desenvolvedores | Sem backend — pós-v1 | **ESCONDER** (código permanece) |

### D.3 Impactos em Links Internos

| Origem | Link Atual | Link v1 |
|--------|------------|---------|
| Dashboard quick actions | `/pix-keys` | `/wallet` |
| Qualquer "Minhas chaves" | `/pix-keys` | `/wallet` |

### D.4 Quick Actions do Dashboard

| Ação | Ícone | Rota | Status |
|------|-------|------|--------|
| Receber | ArrowDownLeft | `/receive` | Manter |
| Enviar | ArrowUpRight | `/send` | Manter |
| Extrato | FileText | `/history` | Manter |
| Carteira | Wallet | `/wallet` | **Substituir** (era Chaves PIX) |

---

## E. Fila de Execução

### E.1 Grupo 1: History (Religação Pura)

**Prioridade:** 1 (primeiro a executar)
**Tipo:** Religação — sem backend novo

#### Escopo

1. Substituir `mockTransactions` por `useTransactions()`
2. Implementar filtro `type` (Todas/Entradas/Saídas)
3. Implementar busca local (ID/descrição)
4. Implementar paginação com `meta`
5. Adicionar estados: loading (skeleton), vazio (empty state), erro (retry)
6. Adicionar campos expandíveis: Bruto|Taxa|Líquido, ID copiável, E2E copiável, payerName
7. Adicionar botão "Ver comprovante" quando `receiptUrl` disponível
8. Remover botões decorativos: Exportar, Filtros avançados, Últimos 30 dias

#### Dependências

- Nenhuma — usa endpoints existentes

#### Critério de Aprovação

- [ ] Lista carrega dados reais da API
- [ ] Filtros Todas/Entradas/Saídas funcionam
- [ ] Busca por ID funciona
- [ ] Paginação funciona
- [ ] Loading state visível
- [ ] Empty state visível quando sem transações
- [ ] Erro state com retry funciona
- [ ] Campos expandíveis exibem informações corretas
- [ ] Botão comprovante funciona (abre URL)

---

### E.2 Grupo 2: Receive + Send (Correção Arquitetural)

**Prioridade:** 2
**Tipo:** Religação + anatomia nova

#### Escopo — Receive

1. Trocar `useCreatePix2DepixDeposit` por `useCreateDeposit`
2. Ajustar mapeamento de campos (qrCopyPaste → pixCopyPaste)
3. Trocar `usePix2DepixDepositStatus` por `useDeposit` (polling)
4. Implementar countdown real com `expiresAt`
5. Distinguir status: under_review, delayed com mensagens próprias
6. Adicionar payerName após confirmação
7. Estados: loading, sucesso, expirado, erro
8. Remover botões decorativos: Atualizar, Ajuda, Config

#### Escopo — Send

1. Trocar `useCreatePix2DepixWithdraw` por `useCreateWithdrawal`
2. Criar hook `useWithdrawal` para polling
3. **Remover** etapa de "enviar DePix" — fluxo é saldo interno
4. Implementar anatomia de steps verticais
5. Adicionar avisos de perda irreversível (inline + modal com checkbox)
6. Adicionar E2E ID copiável
7. Adicionar botão "Ver comprovante" com `receiptUrl`
8. Usar `useEstimateFee` para taxa real
9. Estados: loading, sucesso, erro
10. Remover botões decorativos: Atualizar

#### Dependências

- Criar hook `useWithdrawal` em use-queries.ts

#### Critério de Aprovação

**Receive:**
- [ ] QR Code gerado via Laravel
- [ ] Polling funciona via Laravel
- [ ] Countdown decrementa em tempo real
- [ ] Status under_review mostra "Em análise"
- [ ] Status expirado tratado corretamente

**Send:**
- [ ] Saque criado via Laravel
- [ ] Polling de status funciona
- [ ] Modal de confirmação com checkbox obrigatório
- [ ] E2E ID exibido e copiável quando disponível
- [ ] Comprovante abre quando disponível
- [ ] Taxa calculada via endpoint

---

### E.3 Grupo 3: Dashboard (Resumos + Navegação)

**Prioridade:** 3
**Tipo:** Simplificação + navegação

#### Escopo

1. Remover dados mock: entradas/saídas do dia, sparkline, chaves cadastradas
2. Manter: saldo real, transações recentes reais, quick actions
3. Atualizar quick action "Chaves PIX" → "Carteira" (`/wallet`)
4. Implementar estados: loading (skeleton), erro
5. Remover filtros decorativos
6. Remover botão QR sem função

#### Dependências

- Tela Carteira criada (para link funcionar)

#### Critério de Aprovação

- [ ] Dashboard mostra apenas dados reais
- [ ] Loading skeleton visível
- [ ] Quick action Carteira funciona
- [ ] Nenhum dado mock exibido

---

### E.4 Grupo 4: Carteira (Backend Novo + Tela + Migração)

**Prioridade:** 4
**Tipo:** Backend novo + tela nova + migração

#### Escopo — Backend (api/)

1. Migration: adicionar campos `liquid_address`, `liquid_address_label`, `liquid_address_updated_at` em `wallets`
2. Endpoints: `GET /v1/wallet/liquid-address`, `PUT /v1/wallet/liquid-address`
3. Validação de endereço Liquid (prefixo, comprimento)
4. Código de verificação por e-mail
5. Trava de 24h
6. E-mail de notificação após alteração

#### Escopo — Frontend (flyerx-web/)

1. Criar `(main)/wallet/page.tsx`
2. Criar hooks: `useLiquidAddress`, `useUpdateLiquidAddress`
3. Implementar fluxo de alteração com código de e-mail
4. Exibir aviso "NÃO envie Bitcoin"
5. Migração do localStorage (`useFeesStore.wallets`)
6. Redirect de `/pix-keys` para `/wallet`

#### Escopo — Sidebar

1. Renomear "Chaves PIX" para "Carteira"
2. Atualizar ícone e rota

#### Dependências

- Backend deve ser implementado antes do frontend

#### Critério de Aprovação

- [ ] Endpoint GET retorna endereço ou null
- [ ] Endpoint PUT exige código de e-mail
- [ ] Endpoint PUT aplica trava de 24h
- [ ] Tela exibe endereço cadastrado
- [ ] Tela permite alteração com verificação
- [ ] Aviso de Bitcoin visível
- [ ] Migração do localStorage funciona
- [ ] Sidebar atualizada

---

### E.5 Grupo 5: Settings + Estados Globais

**Prioridade:** 5
**Tipo:** Simplificação + polish

#### Escopo — Settings

1. Remover abas: business, notifications, appearance
2. Manter apenas: segurança (2FA, dispositivos, senha)
3. Implementar modais funcionais para cada ação
4. Remover botão "Entrar com biometria" do login

#### Escopo — Estados Globais (9 telas)

| Tela | Loading | Vazio | Erro |
|------|---------|-------|------|
| dashboard | Implementar | OK | Implementar |
| receive | OK | N/A | Melhorar |
| send | OK | N/A | Melhorar |
| history | Implementar | Implementar | Implementar |
| wallet | Implementar | Implementar | Implementar |
| settings | OK | N/A | Implementar |
| pix-keys | Redirect | N/A | N/A |
| payment-links | Esconder | N/A | N/A |
| subaccounts | Esconder | N/A | N/A |
| developers | Esconder | N/A | N/A |

#### Critério de Aprovação

- [ ] Settings mostra apenas segurança
- [ ] Modais de 2FA/dispositivos/senha funcionam
- [ ] Todas as telas v1 têm loading state
- [ ] Todas as telas v1 têm erro state com retry
- [ ] 3 telas escondidas do menu

---

## F. Registros Pós-v1

### F.1 PRÉ-REQUISITOS DE GO-LIVE

> ⚠️ **CRÍTICO:** Estes itens são obrigatórios antes de produção com dinheiro real.

| Item | Descrição | Risco se Ausente |
|------|-----------|------------------|
| **MED Handler** | Implementar tratamento do webhook MED da Eulen | Saldo negativo, prejuízo financeiro |
| **Assinatura de Webhook** | Habilitar `validate_signature = true` | Webhooks forjados, créditos indevidos |

### F.2 Funcionalidades Adiadas

| Item | Descrição | Impacto |
|------|-----------|---------|
| Limites dinâmicos | Chamar `/user-info` da Eulen em vez de hardcode | UX — limites mais precisos |
| Exportar CSV/PDF | Implementar `exportTransactionsCsv/Pdf` | UX — auditoria do usuário |
| Múltiplas carteiras | Array de endereços Liquid | UX — flexibilidade |
| Links de Pagamento | Backend + tela funcional | Negócio — nova feature |
| Subcontas | Backend + tela funcional | Negócio — nova feature |
| Desenvolvedores | API keys + webhooks de saída | Negócio — integrações |
| Status de serviços | Dashboard de health da Eulen | UX — transparência |
| Repassar taxas | Opção de cobrar taxa do pagador | Negócio — flexibilidade |
| Cancelar depósito | Botão cancelar antes de pagar | UX — controle |
| Cancelar saque | Botão cancelar se ainda pendente | UX — controle |

### F.3 Telas Escondidas v1

| Tela | Rota | Ação |
|------|------|------|
| payment-links | `/payment-links` | Remover do menu, código permanece |
| subaccounts | `/subaccounts` | Remover do menu, código permanece |
| developers | `/developers` | Remover do menu, código permanece |

---

## Changelog

| Data | Autor | Descrição |
|------|-------|-----------|
| 2026-08-06 | Claude | Documento inicial — Passo 2 Fase 6 |

---

*Documento gerado como parte do Passo 2 da Fase 6 — Decisões de Conteúdo e Integração.*
