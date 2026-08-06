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

## Próximos Grupos

- **Grupo 2:** Send (saque) — aguardando
- **Grupo 3:** Dashboard — aguardando
- **Grupo 4:** Settings (limitado) — aguardando
- **Grupo 5:** Receive (depósito) — aguardando

---

*Documento criado em 2026-08-06 — Fase 6, Passo 3*
