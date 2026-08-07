# Execução da Integração Frontend ↔ Backend

**Fase 6 — Passo 3: Religação de Telas**

---

## Grupo 1: History (Extrato)

**Data de execução:** 2026-08-06
**Status:** ✅ CONCLUÍDO

### Arquivos Modificados

| Arquivo | Tipo de mudança |
|---------|-----------------|
| `flyerx-web/src/app/(main)/history/page.tsx` | Reescrito completamente |
| `flyerx-web/src/types/index.ts` | Adicionados novos status e campos |
| `flyerx-web/src/lib/api/mock-data.ts` | Ampliado com dados de teste |
| `flyerx-web/src/app/(main)/dashboard/page.tsx` | Atualizado statusBadge (compatibilidade de tipos) |

### O Que Foi Implementado

#### 1. Conexão com Hook Real
- Removido `mockTransactions` inline
- Conectado ao `useTransactions()` de `@/hooks/use-queries`
- Paginação funcional via parâmetros `page` e `limit`
- Filtro `type` enviado para a API (`DEPOSIT` ou `WITHDRAWAL`)

#### 2. Mapeamento Completo de Status

| Status API | Label PT-BR | Badge |
|------------|-------------|-------|
| `COMPLETED` | Concluído | success (verde) |
| `PENDING` | Pendente | warning (amarelo) |
| `AWAITING_PAYMENT` | Aguardando | warning |
| `PROCESSING` | Processando | warning |
| `UNDER_REVIEW` | Em análise | warning |
| `DELAYED` | Aguardando processamento | warning |
| `FAILED` | Falhou | error (vermelho) |
| `CANCELLED` | Cancelado | neutral |
| `EXPIRED` | Expirado | neutral |
| `REFUNDED` | Devolvido | neutral |
| `REJECTED` | Rejeitado | error |

#### 3. Anatomia por Transação

**Linha principal:**
- Ícone de tipo (seta verde/vermelha)
- Descrição + ID truncado
- Valor com sinal (+/-)
- Badge de status
- Data formatada
- Chevron de expansão

**Painel expandido (DataRow/DataRowGroup):**
- **Valores:** Bruto | Taxa | Líquido
- **Identificadores:**
  - ID da transação (copiável)
  - Endereço Liquid (saques, copiável)
  - E2E ID (saques concluídos, copiável)
  - Pagador (depósitos)
  - CPF/CNPJ (depósitos, mascarado)
  - Destinatário (saques)
  - Chave PIX (saques)
- **Comprovante:** Link externo para `receiptUrl` quando disponível

#### 4. Estados Implementados

| Estado | Componente | UX |
|--------|------------|-----|
| Loading | `SkeletonListItem` × 5 | Shimmer animado |
| Vazio | `EmptyState` com ícone FileText | Mensagem contextual (filtro vs. novo usuário) |
| Erro | `Alert` variant error + botão retry | Permite recarregar dados |

#### 5. Filtros

| Filtro | Implementação |
|--------|---------------|
| Todas/Entradas/Saídas | Botões toggle, envia `type` para API |
| Busca | Local (filtra ID, descrição, pixKey, payerName, recipientName) |

#### 6. Botões Removidos

| Botão | Decisão (do 02-decisoes) |
|-------|--------------------------|
| Exportar | Removido (pós-v1) |
| Filtros avançados | Removido (pós-v1) |
| Últimos 30 dias | Removido (pós-v1) |

### Tipos Atualizados

```typescript
// Novos status adicionados em TransactionStatus
| 'AWAITING_PAYMENT'
| 'UNDER_REVIEW'
| 'DELAYED'
| 'REFUNDED'
| 'REJECTED'

// Campos adicionados em Deposit
payerName?: string;
payerTaxNumber?: string;
payerEuid?: string;
bankTxId?: string;

// Campos adicionados em Withdrawal
endToEndId?: string;      // E2E ID do PIX
receiptUrl?: string;       // URL do comprovante
liquidAddress?: string;    // Endereço Liquid
transferDate?: string;     // Data da transferência
```

### Decisões Tomadas Durante Execução

1. **Dashboard atualizado por cascata:** A adição de novos valores em `TransactionStatus` quebrou o TypeScript do dashboard. Adicionados os status faltantes ao `statusBadge` do dashboard como mudança mínima necessária.

2. **Campos ausentes ocultos graciosamente:** Todos os campos opcionais (payerName, receiptUrl, etc.) são verificados antes de renderizar. Se `undefined`, a DataRow correspondente não aparece.

3. **Busca local:** A busca permanece local (filtra dados carregados) pois a API de transações não oferece endpoint de busca textual. Para v1, isso é aceitável dado o limite de 10 transações por página.

4. **Totais da página atual:** Os totais (Total Recebido / Total Enviado) são calculados sobre os dados da página atual, não sobre todo o histórico. Decisão documentada para revisão pós-v1.

### Validação

**Para testar com backend local:**

1. Subir o backend:
   ```bash
   cd api && make up && make setup
   ```

2. Subir o frontend:
   ```bash
   cd flyerx-web && pnpm dev
   ```

3. Verificar os seguintes comportamentos:

| Item | Como verificar |
|------|----------------|
| Lista carrega | Acessar `/history` — transações aparecem |
| Loading state | Recarregar página — skeleton aparece brevemente |
| Expansível | Clicar em transação — painel abre com Valores/Identificadores |
| IDs copiáveis | Clicar no ícone de cópia — toast "ID copiado" |
| Filtros | Alternar Todas/Entradas/Saídas — lista atualiza |
| Busca | Digitar ID parcial — lista filtra |
| Estado vazio | Filtrar por tipo sem resultados — EmptyState aparece |
| Paginação | Se houver +10 transações — botões Anterior/Próxima funcionam |
| Status variados | Mock inclui UNDER_REVIEW, DELAYED, REFUNDED — badges corretos |
| Comprovante | Saque concluído (txn-002) — link "Ver comprovante" aparece |

### Critério de Aprovação

> Lista carrega dados reais

A validação final deve ser feita no navegador com o `api/` rodando.

---

## Sessão 15-16: Arqueologia das Integrações Receive/Send

**Data de verificação:** 2026-08-07
**Status:** ⚠️ DOCUMENTAÇÃO — integração parcial com problemas críticos

### Contexto

Em sessões anteriores (15), as páginas receive e send foram redesenhadas com novo layout hero centralizado. Esta seção documenta o **estado real** da integração conforme encontrado no código, não conforme planejado.

### Commits Analisados

| Hash | Descrição | Arquivos |
|------|-----------|----------|
| `158ff7c` | feat: novo layout hero centralizado para receive/send | receive/page.tsx, send/page.tsx |
| `7245544` | docs: arquitetura definitiva de integração — intermediador não-custodial | CONTINUIDADE.md, 02-decisoes-integracao.md |

---

## Estado Atual: RECEIVE (Depósito)

### Arquitetura Implementada (vs. Planejada)

```
PLANEJADO (02-decisoes-integracao.md):
receive.tsx → Laravel /v1/deposits → Eulen (com split)
                  ↓
             Ledger registra

IMPLEMENTADO (código atual):
receive.tsx → /api/pix2depix/deposit (proxy Next.js) → Eulen (DIRETO)
                  ↓
             NENHUM registro no Laravel
```

### Hooks e Endpoints Usados

| Elemento | Código |
|----------|--------|
| Hook de criação | `useCreatePix2DepixDeposit()` (linha 111) |
| Endpoint | `/api/pix2depix/deposit` → Eulen diretamente |
| Hook de status | `usePix2DepixDepositStatus()` (linha 112) |

### Fluxo de Dados (receive/page.tsx:226-231)

```typescript
const result = await createDeposit.mutateAsync({
  amountReais: pixAmount,
  endUserTaxNumber: data.payerDocument.replace(/\D/g, ''),
  depixAddress: defaultWallet.address,
});
```

### ⚠️ Problemas Críticos Identificados

| Problema | Gravidade | Descrição |
|----------|-----------|-----------|
| **Sem split de taxa** | 🔴 CRÍTICA | Não envia `depixSplitAddress` nem `splitFee` — taxa Flyerx NÃO é cobrada |
| **Pula o Laravel** | 🔴 CRÍTICA | Vai direto para Eulen, ledger não é atualizado |
| **Carteira em localStorage** | 🟡 ALTA | `defaultWallet.address` vem de Zustand/localStorage, não do backend |
| **History não reflete** | 🔴 CRÍTICA | Depósitos feitos aqui NÃO aparecem no `/history` |

### Campos Enviados vs. Necessários

| Campo | Enviado? | Observação |
|-------|----------|------------|
| `amountInCents` | ✅ Sim | `amountReais * 100` |
| `endUserTaxNumber` | ✅ Sim | CPF/CNPJ do pagador |
| `depixAddress` | ✅ Sim | Carteira Liquid do USUÁRIO (destino do DePix) |
| `depixSplitAddress` | ❌ NÃO | Carteira Flyerx para receber taxa |
| `splitFee` | ❌ NÃO | Percentual da taxa |

### Credencial Eulen

| Variável | Tipo | Problema |
|----------|------|----------|
| `NEXT_PUBLIC_PIX2DEPIX_TOKEN` | PÚBLICA | Token da Eulen exposto no frontend |

---

## Estado Atual: SEND (Saque)

### Arquitetura Implementada

```
PLANEJADO:
send.tsx → Laravel /v1/withdrawals → Python → Eulen
                  ↓
             Ledger registra

IMPLEMENTADO (código atual):
send.tsx → Python /internal/withdrawals (direto) → Eulen
    OU
send.tsx → /api/pix2depix/withdraw → Eulen (direto)
                  ↓
             NENHUM registro no Laravel
```

### Hooks e Endpoints Usados

| Modo | Hook | Endpoint |
|------|------|----------|
| Normal | `useCreateBackendWithdraw()` | Python `/internal/withdrawals` |
| Direto | `useCreateDirectEulenWithdraw()` | `/api/pix2depix/withdraw?direct=true` |
| Status | `useBackendWithdrawStatus()` | Python `/internal/withdrawals/{id}/status` |

### Fluxo de Dados (send/page.tsx:264-278)

```typescript
// Usuário normal: chama backend Python (LWK)
const result = await createBackendWithdraw.mutateAsync({
  user_id: user?.id || 'anonymous',
  pix_key: normalizedPixKey,
  pix_key_type: data.pixKeyType,
  beneficiary_tax_number: taxNumber,
  amount_cents: Math.round(data.amount * 100),
});
```

### ✅ O Que Funciona

| Item | Status | Observação |
|------|--------|------------|
| Taxa de parceiro | ✅ | Python/LWK retém taxa Flyerx antes de enviar para Eulen |
| Status via polling | ✅ | `useBackendWithdrawStatus` atualiza UI |
| 9 estados internos | ✅ | pending → depix_received → processing → completed |
| Limite diário | ✅ | `useDailyLimit()` consulta Python |

### ⚠️ Problemas Identificados

| Problema | Gravidade | Descrição |
|----------|-----------|-----------|
| **Pula o Laravel** | 🟡 ALTA | Frontend chama Python diretamente, não via Laravel |
| **Ledger não atualizado** | 🔴 CRÍTICA | Saques não são registrados no ledger do Laravel |
| **History não reflete** | 🔴 CRÍTICA | Saques feitos aqui NÃO aparecem no `/history` |
| **user_id fixo** | 🟡 MÉDIA | Usa `'anonymous'` quando usuário não autenticado |

### Credencial Backend

| Variável | Tipo | Problema |
|----------|------|----------|
| `NEXT_PUBLIC_INTERNAL_API_KEY` | PÚBLICA | API key do Python exposta no frontend |

---

## Carteira Liquid (Estado Atual)

### Onde está armazenada

```
PLANEJADO (02-decisoes-integracao.md seção C):
Backend Laravel → tabela wallets → campo liquid_address

IMPLEMENTADO:
Frontend Zustand → localStorage('flyerx-fees-storage') → wallets[]
```

### Estrutura (stores/fees.ts)

```typescript
interface SavedWallet {
  id: string;
  label: string;
  address: string;      // Endereço Liquid (lq1... ou ex1...)
  isDefault: boolean;
  createdAt: string;
}
```

### Problemas

| Problema | Impacto |
|----------|---------|
| Perda ao trocar navegador/dispositivo | Usuário perde carteiras cadastradas |
| Sem validação server-side | Qualquer endereço é aceito |
| Sem auditoria | Não há histórico de alterações |
| Não integrado com depósito via Laravel | Backend não sabe o endereço do usuário |

---

## Resumo: 5 Pontos Críticos

| # | Pergunta | Resposta | Status |
|---|----------|----------|--------|
| 1 | Depósito usa split (depixAddress + splitFee)? | ❌ NÃO — taxa Flyerx não é cobrada | 🔴 |
| 2 | Carteira vem do backend? | ❌ NÃO — localStorage via Zustand | 🔴 |
| 3 | Saque usa Python/LWK com status reais? | ✅ SIM — mas pula Laravel | 🟡 |
| 4 | Operações registradas no ledger? | ❌ NÃO — history não reflete | 🔴 |
| 5 | Credenciais protegidas server-side? | ❌ NÃO — NEXT_PUBLIC expõe tokens | 🔴 |

---

## Fila Recalculada

Com base no estado real, a fila do 02-decisoes-integracao.md precisa ser recalculada:

| Grupo | Planejado | Status Real |
|-------|-----------|-------------|
| **1. History** | Religação pura | ✅ CONCLUÍDO (sessão 13) |
| **2. Carteira** | Backend + tela | ❌ NÃO INICIADO — backend não tem endpoints |
| **3. Depósito** | Religação via Laravel | ❌ NÃO INICIADO — ainda usa Eulen direto sem split |
| **4. Saque** | Religação via Laravel | ⚠️ PARCIAL — usa Python mas pula Laravel |
| **5. Pipeline registro** | Ledger recebe operações | ❌ NÃO INICIADO — nada é registrado |
| **6. Polish** | Dashboard + Settings | ❌ BLOQUEADO por anteriores |

### Nova Fila Proposta

```
1. Carteira (BLOQUEADOR)
   └─→ Backend: criar endpoints /v1/wallet/liquid-address
   └─→ Frontend: migrar de localStorage para backend

2. Depósito (DEPENDE de Carteira)
   └─→ Backend: ajustar /v1/deposits para usar split
   └─→ Frontend: migrar de /api/pix2depix/deposit para /v1/deposits

3. Saque (DEPENDE de Depósito estar OK)
   └─→ Backend: Laravel deve chamar Python (não frontend direto)
   └─→ Frontend: migrar para /v1/withdrawals

4. Pipeline de Registro
   └─→ Webhook Eulen → Laravel → Ledger
   └─→ Polling Python → Laravel → Ledger

5. Credenciais
   └─→ Mover tokens para server-side (API routes sem NEXT_PUBLIC)

6. Polish
   └─→ Dashboard, Settings
```

---

*Seção adicionada em 2026-08-07 — Sincronização documental*
