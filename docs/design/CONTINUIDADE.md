# CONTINUIDADE — Retrofit Visual Flyerx Web

**Atualizado em:** 2026-08-07 (sessão 17 — Implementação flag useDirectEulen)
**Regra:** Este documento é atualizado ao FIM de cada sessão de trabalho e ao fechar cada grupo/fase. Qualquer sessão ou conversa nova começa lendo: este arquivo → CLAUDE.md (raiz e flyerx-web) → 01-decisoes.md.

---

## Estado atual do fluxo

- [x] Fase 1 — Auditoria (00-auditoria-web.md)
- [x] Fase 2 — Decisões (01-decisoes.md, 15 seções: tokens, pares, radius, spacing, ícones, grid, tipografia D.3, buttons D.2, contraste seção 14, formulários seção 15)
- [x] Fase 3 — Consolidação da biblioteca (02-consolidacao.md; commits c734667 até 0c5842c; inclui: unificação de pares, sintaxe Tailwind 4 religada, autofill fix, color-scheme dark, auditoria sistêmica de contraste com 7 correções)
- [x] Fase 4 — Migração de telas — **COMPLETA**:
  - [x] **Grupo A CONCLUÍDO** (receive, send) — commits `98b6fa1` até `9d0c21b`
  - [x] **Grupo B COMPLETO** (login, register, forgot-password, verify-email) — sessões 3-4
  - [x] **Grupo C COMPLETO** (history, dashboard) — sessão 5, commit `82e56f5`
  - [x] **Grupo D COMPLETO** (pix-keys, payment-links, subaccounts, developers, settings) — sessão 6
  - [x] **Templates criados** (05-templates.md) — Template A (app) e Template B (auth)
- [x] Fase 5 — QA final — **CONCLUÍDA** (sessão 7):
  - [x] Layout e componentes de layout migrados (layout.tsx, sidebar.tsx, header.tsx, verification-banner.tsx)
  - [x] 6 violações críticas de sintaxe `[--` corrigidas
  - [x] Tipografia e dimensões arbitrárias corrigidas
  - [x] Grid responsivo aplicado no dashboard
  - [x] Regra de imports atualizada (ambos formatos válidos)
  - [x] Documentação corrigida (CLAUDE.md, 06-qa-final.md)
  - [x] **RETROFIT VISUAL COMPLETO**
- [ ] Fase 6 — Integração & Conteúdo — **EM ANDAMENTO (BLOQUEADO)**:
  - [x] **Passo 0 CONCLUÍDO** (higiene documental) — sessão 8
  - [x] **Passo 1a COMPLETO** (3 catálogos + documentação Eulen versionada) — sessões 9-10
  - [x] **Passo 1b COMPLETO** (inventário de dados das telas) — sessão 11
  - [x] **Passo 2 COMPLETO** (decisões de integração) — sessão 12
  - [x] **Passo 2.5 COMPLETO** (arquitetura definitiva — intermediador não-custodial) — sessão 14
  - [x] **Passo 3 Grupo 1 COMPLETO** (history religado) — sessão 13
  - [⚠️] **Passo 3 Grupos 2-5 DIVERGENTES** — sessão 15 fez UI mas não integração; sessão 16 arqueologia revelou problemas críticos

---

## Sessão 17 (2026-08-07) — Implementação flag useDirectEulen

### O que foi feito

1. **Análise da arquitetura de saque Laravel vs Python**
   - `WithdrawalService.php` usa `PaymentProviderFactory::default()` (EulenProvider direto)
   - `LwkService.php` já existe e funciona para chamar o microserviço Python
   - Interfaces incompatíveis: PaymentProviderInterface vs LwkServiceInterface

2. **Flag `useDirectEulen` implementada no Laravel**
   - Entidade `User.php`: método `useDirectEulen()` adicionado (lê de `metadata['use_direct_eulen']`)
   - DTO `UserDTO.php`: campo `useDirectEulen` adicionado
   - API `/v1/auth/me` agora retorna `use_direct_eulen` no JSON

3. **Frontend já preparado**
   - Tipo `User` em `types/index.ts` já tinha `useDirectEulen?: boolean` (linha 21)
   - `send/page.tsx` já consome `user?.useDirectEulen` para escolher o fluxo correto

### Arquivos modificados

```
api/app/Domain/Identity/Entities/User.php
  └── +8 linhas: método useDirectEulen()

api/app/Application/Identity/DTOs/UserDTO.php
  └── +3 linhas: campo useDirectEulen no construtor, fromEntity, toArray
```

### Decisão arquitetural registrada

| Cenário | Fluxo | Taxa de parceiro |
|---------|-------|------------------|
| Usuário normal (`useDirectEulen=false`) | Frontend → Proxy → Python/LWK → Eulen | ✅ SIM (retida no microserviço) |
| Seller especial (`useDirectEulen=true`) | Frontend → Proxy → Eulen direto | ❌ NÃO (saque sem taxa) |

**Como ativar para um usuário:** Admin define `metadata['use_direct_eulen'] = true` no registro do usuário (via SQL ou painel admin futuro).

### Próximo passo

O fluxo atual funciona assim:
- Frontend chama proxies Next.js (`/api/pix2depix/*`)
- Proxies chamam Eulen ou Python diretamente
- Laravel não é usado para operações (apenas para auth/user)

Para arquitetura completa (Frontend → Laravel → Provider), seria necessário:
1. Modificar `WithdrawalService.php` para verificar `useDirectEulen` do usuário
2. Rotear para `LwkService` (normal) ou `EulenProvider` (direto)
3. Frontend chamar endpoints Laravel em vez de proxies

Essa refatoração fica documentada como **melhoria futura** — o fluxo atual atende MVP.

---

## Sessão 16 (2026-08-07) — Arqueologia e Sincronização Documental

### O que foi feito

1. **Análise do código real vs. documentação planejada**
   - Git log analisado: commits `158ff7c` (layout hero) e `7245544` (arquitetura definitiva)
   - receive/page.tsx e send/page.tsx lidos completamente
   - Hooks e endpoints usados mapeados

2. **5 Pontos Críticos Verificados**

| # | Pergunta | Resposta | Status |
|---|----------|----------|--------|
| 1 | Depósito usa split (depixAddress + splitFee)? | ❌ NÃO — taxa Flyerx não é cobrada | 🔴 |
| 2 | Carteira vem do backend? | ❌ NÃO — localStorage via Zustand | 🔴 |
| 3 | Saque usa Python/LWK com status reais? | ✅ SIM — mas pula Laravel | 🟡 |
| 4 | Operações registradas no ledger? | ❌ NÃO — history vazio | 🔴 |
| 5 | Credenciais protegidas server-side? | ❌ NÃO — NEXT_PUBLIC expõe tokens | 🔴 |

3. **Discrepâncias Críticas Documentadas**

| Item Planejado | Estado Real | Gap |
|----------------|-------------|-----|
| Depósito via Laravel com split | Depósito via Eulen direto SEM split | 🔴 Receita zero |
| Carteira no backend | Carteira em localStorage | 🔴 Perda de dados |
| Saque via Laravel → Python | Saque via Python direto | 🟡 Sem auditoria |
| Ledger registra operações | Nada registrado | 🔴 History vazio |
| Credenciais server-side | Tokens em NEXT_PUBLIC | 🔴 Exposição |

4. **Documentos Atualizados**
   - `docs/integracao/03-execucao.md`: Seção "Arqueologia das Integrações Receive/Send" adicionada
   - `docs/integracao/02-decisoes-integracao.md`: Seção I "Estado Real vs. Planejado" adicionada
   - `docs/design/CONTINUIDADE.md`: Este registro

### Arquivos NÃO modificados (somente leitura)

Esta sessão foi SOMENTE documental. Nenhum código foi alterado.

### Fila Recalculada

O progresso real é diferente do planejado:

| Grupo Original | Status Planejado | Status Real | Próxima Ação |
|----------------|------------------|-------------|--------------|
| 1. History | Religação | ✅ CONCLUÍDO | — |
| 2. Carteira | Backend+tela | ❌ NÃO INICIADO | **BLOQUEADOR** — criar endpoints no Laravel |
| 3. Depósito | Split+receive | ❌ NÃO INICIADO | Aguarda Carteira |
| 4. Saque | Laravel→Python | ⚠️ PARCIAL | Rotear via Laravel |
| 5. Pipeline | Ledger | ❌ NÃO INICIADO | Aguarda 3 e 4 |
| 6. Polish | Dashboard+Settings | ❌ BLOQUEADO | Aguarda 5 |

### Riscos Imediatos

| Risco | Impacto | Mitigação Sugerida |
|-------|---------|-------------------|
| Taxa não cobrada em depósitos | Receita zero | Priorizar split no receive |
| Tokens expostos | Segurança comprometida | Mover para API routes server-only |
| History vazio | UX quebrada | Acelerar pipeline de registro |

### Próximo passo

**DECISÃO NECESSÁRIA:** A próxima sessão deve resolver o BLOQUEADOR:

1. **Opção A (Backend-first):** Criar endpoints `/v1/wallet/liquid-address` no Laravel
   - Permite integração completa conforme arquitetura
   - Requer modificar `api/` (contraria regra de backend intocável?)

2. **Opção B (Workaround frontend):** Adicionar split no proxy Next.js
   - Mantém backend intocável
   - Taxa Flyerx passa a ser cobrada
   - Carteira permanece em localStorage (risco de perda)

3. **Opção C (Aceitar estado atual para v1):**
   - Documentar como limitação conhecida
   - Taxa de depósito = 0% (sem receita)
   - History fica vazio para operações reais
   - Corrigir pós-v1

---

## Sessão 15 (2026-08-06) — Melhorias UI Receive/Send + TransactionReceipt

### O que foi feito

1. **Header minimalista nas páginas receive/send**
   - Removido card wrapper do header
   - Taxa movida para subtítulo: "Taxa 2% + R$ 0,99"
   - Layout mais limpo e direto

2. **Barra de limite diário sempre visível**
   - Exibe "R$ usado / R$ 5.000" por CPF/CNPJ
   - Usa hook `useDailyLimit(taxNumber)` para consultar backend
   - Mostra R$ 5.000 como default quando sem dados
   - Alerta vermelho quando valor excede limite disponível
   - Botão desabilitado quando limite esgotado

3. **Modal de confirmação de CPF melhorado**
   - Abre automaticamente quando CPF/CNPJ completo (11 ou 14 dígitos)
   - Design com header, documento destacado, e aviso de responsabilidade
   - Botões "Corrigir" e "Está correto"
   - Indicador visual de CPF confirmado no formulário

4. **Correção da fórmula de taxas (BUG CRÍTICO)**
   - **Antes:** Taxa calculada sobre o valor do PIX (incorreto)
   - **Depois:** Taxa calculada sobre o valor original
   - Exemplo: R$ 100 + 2% + R$ 0,99 = R$ 102,99 (não R$ 103,05)
   - Arquivo: `src/types/fees.ts` função `calculateDepositFee`

5. **Correção do valor enviado à API**
   - Quando `passToCustomer=true`, agora envia `amountToCharge` (valor com taxa)
   - **Antes:** Sempre enviava `data.amount` (valor base)
   - **Depois:** `const pixAmount = passToCustomer ? amountToCharge : data.amount`

6. **Steps 2 e 3 melhorados**
   - Step 2 (Pagar PIX): ID da transação visível na barra de status
   - Step 3 (Confirmado): ID copiável, botão de comprovante, layout aprimorado

7. **Componente TransactionReceipt criado**
   - Novo arquivo: `src/components/ui/transaction-receipt.tsx`
   - Props: type (deposit/withdraw), status, id, valores, taxas, documento, carteira, TX blockchain
   - Status suportados: pending, processing, completed, failed, expired
   - Funcionalidades: Copiar ID, Baixar comprovante (PNG via html2canvas)
   - Exportado via `src/components/ui/index.ts`
   - Adicionado ao Design System (`/design-system`)

8. **Dependência html2canvas instalada**
   - Usado para gerar imagem PNG do comprovante

### Arquivos modificados

```
flyerx-web/src/
├── components/ui/
│   ├── transaction-receipt.tsx  # NOVO
│   └── index.ts                 # Export adicionado
├── types/
│   └── fees.ts                  # Fórmula corrigida
├── app/
│   ├── (main)/receive/page.tsx  # Redesenhado
│   ├── (main)/send/page.tsx     # Redesenhado
│   └── design-system/page.tsx   # TransactionReceipt showcase
└── package.json                 # html2canvas adicionado
```

### Bugs corrigidos

| Bug | Causa | Correção |
|-----|-------|----------|
| Taxa R$ 103,05 em vez de R$ 102,99 | Fórmula inversa complexa | Taxa sobre valor original |
| Paguei R$ 10 mesmo com "repassar taxa" | API recebia `data.amount` | API recebe `amountToCharge` |
| `watch` before initialization | Hook antes de `useForm` | Movido para após `useForm` |
| Modal usando variáveis inexistentes | `pendingFormData` não existia | Usar `watch('payerDocument')` |

### Pendências identificadas (para próxima sessão)

| Pendência | Descrição | Solução proposta |
|-----------|-----------|------------------|
| DailyDepositLimit não existe | Só temos `DailyWithdrawLimit` no backend | Criar modelo no backend Python |
| Depósitos não são salvos | Vão direto para Eulen, sem persistência | Criar modelo `Deposit` no backend |
| Comprovante PDF | Apenas PNG funciona | Implementar com jspdf |
| Limite não atualiza após pagamento | `useDailyLimit` consulta saques, não depósitos | Criar endpoint de limite de depósitos |

### Próximo passo

**Testar fluxo de saque (send) end-to-end:**
- Verificar se UI está consistente com receive
- Testar criação de saque via backend Python
- Validar status e comprovante

---

## Sessão 14 (2026-08-06) — Fase 6, Passo 2.5 COMPLETO (Arquitetura Definitiva)

### O que foi feito

1. **Arquitetura definitiva confirmada e documentada**
   - Flyerx = INTERMEDIADOR NÃO-CUSTODIAL (gateway Pix↔DePix) sobre API Eulen
   - Laravel (api/) = backend PRINCIPAL: auth, usuários, wallet, DEPÓSITOS (server-side com split), LIVRO-RAZÃO
   - Python (flyerx-backend/) = MICROSERVIÇO de SAQUES DePix→PIX (existe porque Eulen não tem split em saques)

2. **02-decisoes-integracao.md completamente reescrito**
   - Sumário executivo com modelo de negócio e papéis dos backends
   - Spec do send CORRIGIDA: fluxo Python com 9 status internos (pending→completed), avisos obrigatórios Eulen
   - Spec do receive CORRIGIDA: depósito server-side via Laravel com split (depixAddress=usuário, depixSplitAddress=Flyerx)
   - DEPENDÊNCIA documentada: usuário precisa ter carteira Liquid cadastrada antes de criar depósitos
   - Saldo BRL custodial marcado como código LEGADO DESCONTINUADO

3. **Pipeline de registro especificado**
   - Depósitos: webhook Eulen → Laravel registra no ledger (sem creditar saldo interno)
   - Saques: Laravel faz polling do Python → registra no ledger quando completed
   - Mecanismo de sincronização: scheduler existente `flyerx:sync-withdrawals`

4. **Fila de execução reordenada por dependências**
   - Grupo 1: Carteira (backend+tela) — DESBLOQUEIA depósito
   - Grupo 2: Depósito (split + tela receive)
   - Grupo 3: Saque (tela send com steps/avisos — backend intacto)
   - Grupo 4: Pipeline de registro + ajuste do history
   - Grupo 5: Dashboard + Settings + polish

5. **PRÉ-GO-LIVE consolidado**
   - MED Handler: webhook não tratado, risco de saldo negativo
   - Assinatura de webhook: `validate_signature = false` por padrão
   - LWK_MNEMONIC: migrar para vault em produção
   - Smoke test: depósito e saque mínimo com dinheiro real

6. **plano-backend-lwk.md promovido**
   - De `docs/_arquivo/` para `docs/integracao/referencias/`
   - Nota adicionada: "arquitetura vigente do saque; conferir implementação no 00b"

### Premissas CORRIGIDAS do Passo 2

| Premissa Anterior (ERRADA) | Correção (DEFINITIVA) |
|---------------------------|----------------------|
| "Fluxo de saldo interno" no send | Usuário AINDA envia DePix para endereço Liquid |
| "Não precisa enviar DePix" | Fluxo Python intacto: gera flyerx_address, usuário envia, worker processa |
| Saldo BRL custodial ativo | Código legado DESCONTINUADO, fora de qualquer fluxo v1 |
| Depósito sem split | Depósito usa split: DePix vai para carteira do USUÁRIO, taxa para Flyerx |

### Próximo passo

**Passo 3 Grupo 1 já concluído (sessão 13) — continuar para Grupo 2 (Carteira):**
- Backend: endpoints /v1/wallet/liquid-address
- Frontend: tela /wallet com cadastro/alteração
- Critério: usuário consegue cadastrar endereço Liquid

---

## Sessão 13 (2026-08-06) — Fase 6, Passo 3 Grupo 1 COMPLETO (History Religado)

### O que foi feito

1. **History (extrato) conectado a dados reais**
   - Removido `mockTransactions` inline
   - Conectado ao hook `useTransactions()` de `@/hooks/use-queries`
   - Paginação funcional via API
   - Filtros Todas/Entradas/Saídas funcionais

2. **Tipos atualizados (`src/types/index.ts`)**
   - 5 novos status: `AWAITING_PAYMENT`, `UNDER_REVIEW`, `DELAYED`, `REFUNDED`, `REJECTED`
   - Campos de Deposit: `payerName`, `payerTaxNumber`, `payerEuid`, `bankTxId`
   - Campos de Withdrawal: `endToEndId`, `receiptUrl`, `liquidAddress`, `transferDate`

3. **Mock-data ampliado (`src/lib/api/mock-data.ts`)**
   - 10 transações de teste com todos os status e campos
   - Dados de pagador/destinatário populados

4. **Anatomia expandível implementada**
   - Linha clicável com chevron
   - Painel expandido com DataRow/DataRowGroup
   - Valores: Bruto | Taxa | Líquido
   - IDs copiáveis: ID da transação, Endereço Liquid, E2E ID
   - Pagador/destinatário exibidos quando disponíveis
   - Link "Ver comprovante" quando `receiptUrl` disponível

5. **Estados implementados**
   - Loading: `SkeletonListItem` × 5
   - Vazio: `EmptyState` com mensagem contextual
   - Erro: `Alert` error + botão retry

6. **Botões decorativos removidos**
   - Exportar (pós-v1)
   - Filtros avançados (pós-v1)
   - Últimos 30 dias (pós-v1)

7. **Dashboard atualizado por cascata**
   - `statusBadge` atualizado para incluir novos status (compatibilidade de tipos)

8. **Documentação criada**
   - `docs/integracao/03-execucao.md` com registro completo do Grupo 1

### Build

- ✅ `pnpm build` passou sem erros

### Próximo passo

**Passo 3 Grupo 2 — Send (saque):**
- Ajustar fluxo para usar saldo interno (não mais Pix2Depix direto)
- Conectar ao endpoint de saque do Laravel
- Implementar estados de loading/erro

---

## Sessão 12 (2026-08-06) — Fase 6, Passo 2 COMPLETO (Decisões de Integração)

### O que foi feito

1. **Documento `docs/integracao/02-decisoes-integracao.md` criado**
   - A) Spec por tela v1 (7 telas: dashboard, receive, send, history, carteira, settings, auth)
   - B) Mapa de religação (23 funções órfãs/semi-órfãs mapeadas)
   - C) Backend novo (endpoints de Carteira Liquid)
   - D) Navegação v1 (menu final com 6 itens)
   - E) Fila de execução (5 grupos ordenados)
   - F) Registros pós-v1 (MED/webhook como pré-requisitos de go-live)

2. **Decisões registradas**
   - **Correção arquitetural:** receive/send passam a usar Laravel em vez de Eulen direto
   - **Mudança de paradigma send:** Fluxo de saldo interno (não precisa enviar DePix)
   - **Pix-keys → Carteira:** Nova tela de gestão de endereço Liquid
   - **3 telas escondidas:** payment-links, subaccounts, developers (código permanece)

### Próximo passo

**Passo 3 Grupo 1 — History (religação pura):**
- Substituir `mockTransactions` por `useTransactions()`
- Implementar filtros, busca, paginação
- Adicionar estados: loading, vazio, erro
- Adicionar campos expandíveis: E2E, payerName, receiptUrl

---

## Sessão 11 (2026-08-06) — Fase 6, Passo 1b COMPLETO (Inventário de Telas)

### O que foi feito

1. **Análise de 14 telas do flyerx-web**
   - Para cada tela: dados exibidos (REAL/MOCK/DERIVADO), fontes, estados, ações
   - Cruzamento com catálogos 00a (Laravel) e 00c (Eulen)

2. **Documento `docs/integracao/01b-inventario-telas.md` criado**
   - 14 seções detalhadas (uma por tela)
   - Resumo executivo com rankings e oportunidades

### Principais Descobertas

**4 Telas-Fachada (100% mock, sem backend):**
- payment-links — Links de Pagamento
- subaccounts — Subcontas/Multi-usuário
- developers — API Keys + Webhooks de saída
- pix-keys — Cadastro de chaves PIX

**1 Tela 100% mock com backend existente:**
- history — Extrato (deveria usar `/v1/wallet/history`)

**Top 3 Oportunidades de Conteúdo:**
1. `receiptUrl` — Comprovante oficial do PIX (alto impacto)
2. `centralBankId` (E2E) — Prova irrefutável do PIX (alto impacto)
3. `payerName` — Identifica quem pagou (alto impacto)

**Estados faltantes:**
- 9 telas sem skeleton/loading
- 9 telas sem tratamento de erro

**Ações decorativas:**
- 25+ botões/ações sem implementação real

### Próximo passo

**Passo 2 — Decisões de integração:**
- Priorizar quais dados conectar
- Decidir destino das telas-fachada
- Implementar estados faltantes

---

## Sessão 10 (2026-08-06) — Fase 6, Passo 1a COMPLETO (Catálogo Eulen)

### O que foi feito

1. **Documentação Eulen obtida e versionada**
   - Índice salvo em `docs/integracao/referencias/eulen/llmsEULEN.txt`
   - 15+ páginas da documentação oficial consultadas via WebFetch

2. **Catálogo 00c-catalogo-provedor-eulen.md COMPLETO**
   - 7 endpoints documentados com request/response
   - 10 status de depósito + 6 status de saque
   - 3 tipos de webhook (deposit, withdraw, MED)
   - Capacidades avançadas: QR Delay, Nonce, Sync/Async
   - Rate limits por endpoint
   - **Seção 7: Confronto completo com implementação Laravel**
   - **Tabela de 20 capacidades não aproveitadas**

3. **Análises de risco registradas**
   - **MED (Mecanismo Especial de Devolução):** webhook não tratado, risco de saldo negativo
   - **Status intermediários:** `will_refund`, `under_review`, `delayed` não distinguidos no frontend
   - **Limites dinâmicos:** `/user-info` não chamado, limites hardcoded

### Resumo dos Status

**Depósito (10 status):**
| Terminal | Status |
|----------|--------|
| Não | pending, delayed, under_review, approved, will_refund |
| Sim | depix_sent, refunded, canceled, expired, error |

**Saque (6 status):**
| Terminal | Status |
|----------|--------|
| Não | unsent, sending |
| Sim | sent, error, canceled, refunded |

### Próximo passo

**Passo 1b — Integração frontend-backend:**
- Conectar flyerx-web com api/ (Laravel) para funcionalidades reais
- Documentar em docs/integracao/ os pontos de integração

---

## Sessão 9 (2026-08-06) — Fase 6, Passo 1a (Catálogos e Julgamento)

### O que foi feito

1. **3 catálogos criados em docs/integracao/**
   - `00a-catalogo-api-laravel.md` — 24 rotas, 6 domínios, contratos completos, modelos, estados, integração Eulen
   - `00b-catalogo-microservico-lwk.md` — 9 endpoints, 10 estados de saque, ciclo de vida, taxas, limites
   - `00c-catalogo-provedor-eulen.md` — estrutura criada, aguardando documentação oficial

2. **Julgamento dos 18 documentos [SUSPEITO-VERIFICAR]**

| # | Documento | Veredito | Justificativa |
|---|-----------|----------|---------------|
| 1 | `docs/architecture/01-VISAO-GERAL.md` | **CONFIRMADO** | Stack (PHP 8.4, Laravel 12, DDD) confere com código |
| 2 | `docs/architecture/02-ESTRUTURA-PASTAS.md` | **CONFIRMADO** | Estrutura DDD (Domain, Application, Infrastructure, HTTP) confere |
| 3 | `docs/architecture/03-BANCO-DE-DADOS-PARTE1.md` | **PARCIAL** | Identity Context descrito corretamente; alguns campos podem divergir |
| 4 | `docs/architecture/03-BANCO-DE-DADOS-PARTE2.md` | **PARCIAL** | Wallet/Payment Context geral OK; detalhes não verificados |
| 5 | `docs/architecture/03-BANCO-DE-DADOS-PARTE3.md` | **PARCIAL** | Ledger/Fee/Compliance conceitos OK; implementação pode variar |
| 6 | `docs/architecture/03-BANCO-DE-DADOS-PARTE4.md` | **PARCIAL** | Notification/Config/Views; algumas features não implementadas |
| 7 | `docs/architecture/04-FLUXOGRAMAS.md` | **CONFIRMADO** | Fluxos de depósito, saque, autenticação conferem |
| 8 | `docs/architecture/05-ESTRATEGIA-LEDGER-WALLET.md` | **CONFIRMADO** | Double-entry, saldo calculado, reservas — implementado |
| 9 | `docs/architecture/06-ESTRATEGIA-INTEGRACAO-EULEN.md` | **CONFIRMADO** | Abstração de provider, mapeamento de status — confere |
| 10 | `docs/architecture/07-ESTRATEGIA-SEGURANCA.md` | **CONFIRMADO** | 2FA, rate limiting, JWT — implementado |
| 11 | `docs/architecture/08-ESTRATEGIA-TAXAS.md` | **PARCIAL** | Sistema descrito mais complexo; implementação usa fórmula simples |
| 12 | `docs/architecture/10-RISCOS-E-VALIDACOES.md` | **CONFIRMADO** | Matriz de riscos e ADRs são decisões, não código |
| 13 | `docs/architecture/README.md` | **DIVERGENTE** | Menciona Vue+Inertia para admin (errado: é Next.js) |
| 14 | `docs/DEPLOY_PRODUCAO.md` | **CONFIRMADO** | Instruções de deploy correspondem à arquitetura real |
| 15 | `docs/DEPLOY_RAILWAY.md` | **CONFIRMADO** | Guia de deploy Railway, configurações corretas |
| 16 | `docs/PLANO_WEBHOOKS.md` | **CONFIRMADO** | Plano FUTURO de webhooks (ainda não implementado) — OK como backlog |
| 17 | `flyerx-backend/README.md` | **CONFIRMADO** | Arquitetura, endpoints, fluxo — confere com catálogo 00b |
| 18 | `flyerx-web/README.md` | **PARCIAL** | Stack correta; rotas seller/* e admin/* não existem no web |

> **NOTA:** `api/README.md` não existe (contou como 19° mas arquivo ausente).

### Resumo dos vereditos

| Veredito | Quantidade | Ação |
|----------|------------|------|
| **CONFIRMADO** | 11 | Podem ser usados como referência complementar |
| **PARCIAL** | 6 | Usar com cautela; preferir catálogos para detalhes |
| **DIVERGENTE** | 1 | Corrigir ou marcar como obsoleto |

### Lacunas identificadas (REGISTROS, não tarefas)

| # | Lacuna | Localização | Observação |
|---|--------|-------------|------------|
| 1 | Sem webhook de saída | Laravel + LWK | Laravel faz polling |
| 2 | Sem retry automático em falha | LWK | Saque falho precisa intervenção |
| 3 | Links de Pagamento não implementados | Laravel | Telas existem no frontend |
| 4 | Subcontas não implementadas | Laravel | Telas existem no frontend |
| 5 | API Keys de desenvolvedor não implementadas | Laravel | Telas existem no frontend |
| 6 | Documentação Eulen ausente | docs/integracao/ | Catálogo 00c aguardando |

### Próximo passo

**Passo 1b — Integração frontend-backend:**
- Conectar flyerx-web com api/ (Laravel) para funcionalidades reais
- Documentar em docs/integracao/ os pontos de integração

---

## Sessão 8 (2026-08-06) — Fase 6, Passo 0 (Higiene Documental)

### O que foi feito

1. **Inventário completo de documentação**
   - 38 arquivos .md inventariados (excluindo vendor/node_modules)
   - Classificação: ATUAL, SUSPEITO-FUNCIONAL, SUSPEITO-VERIFICAR, OBSOLETO

2. **Quarentena criada (docs/_arquivo/)**
   - 5 documentos comprovadamente obsoletos movidos:
     - `plano-backend-lwk.md` — plano já executado
     - `plano-backend-lwk-resumo.md` — resumo de plano já executado
     - `integracao-frontend-backend.md` — arquitetura diferente da implementada
     - `architecture/09-ROADMAP.md` — roadmap com checkboxes vazios; backend COMPLETO
     - `flyerx-admin/README.md` — README genérico do create-next-app
   - `LEIA-ME.md` criado com instruções

3. **Documentos marcados como [SUSPEITO-VERIFICAR]**
   - 19 documentos (incluindo toda `docs/architecture/` exceto 09-ROADMAP.md)
   - Serão confrontados com código real pelo Passo 1a (catálogos dos backends)
   - Até lá, não devem ser usados como fonte de verdade sem confirmação

4. **CLAUDE.md da raiz atualizado**
   - Regra 8 adicionada: fontes de verdade documentais
   - docs/design/, docs/integracao/, CONTINUIDADE.md, CLAUDE.md são as fontes
   - docs/_arquivo/ está obsoleto — nunca usar
   - READMEs de api/ e flyerx-backend/ não são fonte de verdade

### Próximo passo

**Passo 1a — Catálogos dos backends:**
- Extrair endpoints, schemas, fluxos de api/ e flyerx-backend/ a partir do CÓDIGO
- Gerar docs/integracao/ como fonte de verdade
- Confrontar documentos [SUSPEITO-VERIFICAR] e decidir: CONFIRMADO ou DIVERGENTE

---

## Sessão 7 (2026-08-06) — QA Final (RETROFIT VISUAL COMPLETO)

### O que foi feito

1. **Layout e componentes de layout MIGRADOS**
   - `layout.tsx`: 4× `rounded-[--radius-md]` → `rounded-md/lg`, tipografia corrigida, dimensões normalizadas
   - `sidebar.tsx`: 1× `rounded-[--radius-lg]` → `rounded-lg`, `h-N w-N` → `size-N`
   - `header.tsx`: 10× `h-N w-N` → `size-N`
   - `verification-banner.tsx`: 1× `rounded-[--radius-md]` → `rounded-md`, tipografia corrigida

2. **Dashboard corrigido**
   - Grid responsivo: `grid-cols-4` → `grid-cols-2 sm:grid-cols-4`
   - Dividers: `h-[30px]` → `h-8`

3. **History corrigido**
   - `max-w-[320px]` → `max-w-xs`

4. **Regra de imports atualizada (CLAUDE.md)**
   - **Antes:** "Sempre importar de index centralizado"
   - **Depois:** "Ambos formatos válidos (direto ou via index). Proibido: -custom ou caminhos fora de components/ui/"
   - Resolveu 85+ "violações" sem necessidade de refatoração massiva

5. **Documentação atualizada**
   - `CLAUDE.md`: Fase 5 concluída, layouts incluídos
   - `06-qa-final.md`: Status das correções registrado
   - `design-system/page.tsx`: Comentário de imports corrigido

### Verificação final

- ✅ `pnpm build` passou sem erros
- ✅ `grep '[--'` em src/ retorna ZERO ocorrências
- ✅ Todas as 6 violações críticas corrigidas
- ✅ Tipografia e dimensões normalizadas
- ✅ Grid responsivo aplicado

### Próxima fase

**Fase 6 — Integração & Conteúdo**

---

## Sessão 6 (2026-08-05) — Grupo D (migração COMPLETA)

### O que foi feito

1. **pix-keys/page.tsx MIGRADO**
   - Sintaxe `[--` corrigida: 7 ocorrências de `rounded-[--radius-*]` → `rounded-xl/lg`
   - Tipografia: `text-[13px]` → `text-sm`, `text-[12px]` → `text-xs`, `text-[9px]` → `text-[10px]`
   - Tamanhos: `w-10 h-10` → `size-10`, `w-8 h-8` → `size-8`
   - Container: `<Container size="lg" padded={false}>` aplicado
   - Import centralizado de `@/components/ui`

2. **payment-links/page.tsx MIGRADO**
   - Sintaxe `[--` corrigida: 8 ocorrências
   - Tipografia: `text-[11px]` → `text-xs`, `text-[14px]` → `text-sm`, `text-[9px]` → `text-[10px]`
   - Grid responsivo: `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`
   - Container aplicado

3. **subaccounts/page.tsx MIGRADO**
   - Sintaxe `[--` corrigida: 7 ocorrências
   - Tipografia completa normalizada
   - Input de busca: `max-w-[320px]` → `max-w-xs`
   - Grid responsivo aplicado
   - Container aplicado

4. **developers/page.tsx MIGRADO**
   - Sintaxe `[--` corrigida: 11 ocorrências
   - Tipografia: todos os `text-[Npx]` convertidos para tokens
   - Tamanhos: `w-9 h-9` → `size-9`, `w-8 h-8` → `size-8`
   - Grid responsivo aplicado
   - Container aplicado

5. **settings/page.tsx MIGRADO**
   - Sintaxe `[--` corrigida: 8 ocorrências
   - Tipografia completa normalizada
   - Tamanhos: `w-9 h-9` → `size-9`, `w-8 h-8` → `size-8`, `w-20 h-20` → `size-20`
   - Switch: já importado do componente oficial (sem recriar)
   - Container aplicado

### Resumo de correções no Grupo D

| Violação | Quantidade corrigida |
|----------|---------------------|
| Sintaxe `[--radius-*]` | 41 ocorrências |
| Tipografia arbitrária | 65+ ocorrências |
| Tamanhos `w-N h-N` | 15 → `size-N` |
| Container faltante | 5 páginas |
| Grid não responsivo | 3 páginas |

### Próxima fase

**Fase 5 — QA final** em sessão LIMPA:
- Comparar todas as telas contra `01-decisoes.md` + `CLAUDE.md`
- Varredura de contraste em todos os estados
- Verificar responsividade (breakpoints sm/md/lg)
- Testar todas as interações (switches, dropdowns, etc.)

---

## Sessão 5 (2026-08-05) — Grupo C

### O que foi feito

1. **history/page.tsx MIGRADO**
   - Sintaxe `[--` corrigida: `rounded-[--radius-xl]` → `rounded-xl`, `rounded-[--radius-lg]` → `rounded-lg`, etc.
   - StatusBadge manual substituído por Badge oficial com variants success/warning/error
   - Tipografia: `text-[12px]` → `text-xs`, `text-[13px]` → `text-sm`
   - Tamanhos: `w-8 h-8` → `size-8`
   - Container: `<Container size="lg" padded={false}>` aplicado

2. **dashboard/page.tsx MIGRADO**
   - Sintaxe `[--` corrigida: `rounded-[--radius-lg]` → `rounded-lg`, `rounded-[--radius-md]` → `rounded-md`
   - Tipografia completa: 15+ valores arbitrários corrigidos para tokens
   - Balance display: `text-[44px]` → `text-5xl`, `text-[26px]` → `text-2xl`
   - Tamanhos: `w-[38px] h-[38px]` → `size-10`, `rounded-[10px]` → `rounded-md`
   - Container: `<Container size="lg" padded={false}>` aplicado

3. **04-migracao-telas.md atualizado** com inventário completo do Grupo C

### Pendente para próxima sessão

- **Grupo D:** pix-keys, payment-links, subaccounts, developers, settings
  - Processo: mesmo ciclo (sintaxe → tipografia → spacing → radius → Container → build → doc)

---

## Sessão 4 (2026-08-05) — Grupo B parte 2 + Templates

### O que foi feito

1. **forgot-password/page.tsx MIGRADO**
   - Sintaxe `[--` corrigida: `rounded-[--radius-xl]` → `rounded-xl`
   - Tipografia: `text-[24px]` → `text-2xl`, `text-[28px]` → `text-2xl`, `text-[13.5px]` → `text-sm`, etc.
   - Spacing: `gap-[14px]` → `gap-3.5`, `gap-[6px]` → `gap-1.5`
   - Tamanho: `w-[52px] h-[52px]` → `size-14`, `size-[11px]` → `size-3`
   - Buttons: `variant="primary"` → `variant="solid"` (D.2)
   - Container: `<Container size="sm" padded={false}>` aplicado

2. **verify-email/page.tsx MIGRADO**
   - Sintaxe `[--` corrigida: `rounded-[--radius-xl]` → `rounded-xl`
   - Tipografia: `text-[24px]` → `text-2xl`, `text-[13.5px]` → `text-sm`, `text-[15px]` → `text-base`, etc.
   - Spacing: `gap-[6px]` → `gap-1.5`
   - Tamanho: `size-[11px]` → `size-3`
   - Buttons: `variant="primary"` → `variant="solid"` (D.2)
   - Container: `<Container size="sm" padded={false}>` aplicado

3. **05-templates.md CRIADO**
   - Template A (Página do app): Container lg, PageHeader, grid responsivo, componentes da biblioteca
   - Template B (Página de auth): min-h-screen centralizado, Container sm, GlowOrbs, labels externos
   - Cada template com esqueleto de código completo + checklist pré-commit

4. **CLAUDE.md atualizado**
   - Estado do retrofit atualizado (Grupos A e B completos)
   - Seção "Página nova" adicionada com regras para criar páginas

### Pendente para próxima sessão

- **Grupos C+D:** history, dashboard, pix-keys, payment-links, subaccounts, developers, settings
  - Processo: mesmo ciclo (sintaxe → tipografia → spacing → radius → Container → build → doc)

---

## Sessão 3 (2026-08-05) — Grupo B parte 1

### O que foi feito

1. **login/page.tsx MIGRADO**
   - Sintaxe `[--` corrigida: `rounded-[--radius-md]` → `rounded-lg/rounded-md`
   - Tipografia: `text-[28px]` → `text-2xl`, `text-[13.5px]` → `text-sm`, etc.
   - Spacing: `gap-[14px]` → `gap-3.5`, `gap-[6px]` → `gap-1.5`, `p-[13px_16px]` → `py-3 px-4`
   - Radius: `rounded-[14px]` → `rounded-lg`
   - Tamanho: `w-[52px] h-[52px]` → `size-14`, `size-[11px]` → `size-3`
   - Buttons: `variant="primary"` → `variant="solid"` (D.2)
   - Container: `<Container size="sm" padded={false}>` aplicado

2. **register/page.tsx MIGRADO**
   - Tipografia: todos `text-[12px]` → `text-xs`, `text-[15px]` → `text-base`, etc.
   - Spacing: `gap-[14px]` → `gap-3.5`, `gap-[6px]` → `gap-1.5`
   - Radius: `rounded-[14px]` → `rounded-lg`
   - Tamanho: `w-[52px] h-[52px]` → `size-14`, `size-[11px]` → `size-3`
   - Buttons: `variant="primary"` → `variant="solid"` (D.2)
   - Container: `<Container size="sm" padded={false}>` aplicado
   - **Checkbox com links Termos/Política preservados**

3. **Correção pós-verificação visual: padrão de formulários**
   - **Nova regra 15** criada em 01-decisoes.md: label EXTERNO é padrão oficial
   - Login: campo E-mail convertido de label interno (glass box) para label externo + Input padrão
   - Login: email readonly convertido para label externo + div altura uniforme (h-10)
   - Gap entre campos padronizado: `gap-4` (regra 15.1)
   - Centralização confirmada: `min-h-screen flex items-center justify-center`
   - Elemento "N" identificado como overlay DevTools do Next.js (não é código da página)

### Pendente para próxima sessão

- **Grupo B parte 2:** forgot-password/page.tsx + verify-email/page.tsx
  - Inventário de violações já documentado em 04-migracao-telas.md
  - Processo: sintaxe `[--` → tipografia → spacing → radius → Container size="sm"

---

## Sessão 2 (2026-08-05) — Correções pós-Grupo A

### O que foi feito

1. **Container aplicado em receive e send** (commit `ab7c9dd`)
   - Regra 8.4: Container size="lg" limita largura em monitores largos

2. **AmountInput criado e aplicado** (commit `f858547`)
   - Novo componente: input de valor monetário com prefixo R$ integrado
   - Corrige: fundo claro, spinners visíveis, prefixo desalinhado
   - Aplicado em receive e send

3. **StepsGuide criado e aplicado** (commit `9d0c21b`)
   - Novo componente: bloco "como funciona" com passos em cards
   - Unifica implementações diferentes de receive e send
   - Padrão oficial: versão com cards (01-decisoes.md seção 8.5)
   - Registrado para admin e mobile herdarem

### Pendente para próxima sessão

- **Grupo B parte 1:** login/page.tsx + register/page.tsx
  - Inventário de violações já documentado em 04-migracao-telas.md
  - Aplicar processo: sintaxe [-- → tipografia → spacing → radius → componentes → Container size="sm"
  - ATENÇÃO register: Checkbox com links de Termos/Política usa label ReactNode — preservar links

---

## Verificação visual pendente

O usuário deve verificar ANTES de iniciar a próxima sessão:

1. **history/page.tsx:**
   - Container limitando largura em monitor largo
   - Badge oficial com cores corretas (verde/amarelo/vermelho)
   - Tipografia padronizada (text-xs, text-sm)

2. **dashboard/page.tsx:**
   - Container limitando largura em monitor largo
   - Balance display com tipografia tokens (text-5xl, text-2xl)
   - Quick actions com icon boxes size-10 e rounded-md

---

## Aviso técnico crítico (seção 14.3 do 01-decisoes.md)

```
bg-accent / text-accent = accent-900 (ESCURO, #2b2741)
bg-primary / text-primary = vibrante (#9184d9)
```

Para cores vibrantes (CTAs, estados checked) usar **PRIMARY**; accent puro só para fundos de destaque escuro. Este token ambíguo foi a causa raiz de 12 bugs de contraste.

---

## Regras operacionais do processo (imutáveis)

1. **Handoff entre sessões = markdown no repo**, nunca memória de conversa
2. **Documento atualizado ao fim de CADA ação/página** — trabalho não documentado é trabalho perdido
3. **pnpm build a cada mudança**; commit a cada marco; git log antes de refazer qualquer coisa pós-compactação
4. **Visual nunca muda funcionalidade/textos**; achados vão para TODO.md
5. **Biblioteca (components/ui/) só é alterada com decisão explícita** — telas nunca criam variação
6. **Inspeção visual do usuário nos portões** (foi ela que originou a auditoria de contraste)
7. **Backend (api/ e flyerx-backend/) intocável**

---

## Pós-retrofit (backlog acordado)

- Retrofit do flyerx-admin (herda tokens/regras de docs/design/ — mesma stack)
- Retrofit do flyerx-mobile (adapta tokens para NativeWind; specs em 03-layouts.md)
- Criar agentes em .claude/agents/:
  - **design-auditor** — só lê, relata violações
  - **design-executor** — executa conforme docs, ciclo build+doc+commit
  - **design-guardian** — mudanças futuras no design system: avalia impacto, atualiza 01-decisoes.md com justificativa, aplica, mantém docs e código sincronizados
- Repositório GitHub privado para backup off-site
- Passada de microcopy/UX writing (fora do escopo visual)

---

## Commits da consolidação e migração

| Hash | Descrição |
|------|-----------|
| `c734667` | chore: baseline do monorepo Flyerx |
| `45e11c2` | chore(design): finaliza consolidação do design system Nocturne |
| `0b8b3b6` | chore(design): completa showcase e adiciona exports faltantes |
| `bba7b35` | fix(design): corrige swatches, tabs variants, page-header kicker |
| `aee027a` | chore(design): aplica cores semânticas e registra regras de Button/Tipografia |
| `6994961` | fix(design): força tema escuro em controles nativos (color-scheme dark) |
| `0c5842c` | fix(design): auditoria sistêmica de contraste em todos os estados |
| `98b6fa1` | feat(design): migra receive e send para o design system Nocturne (Grupo A) |
| `ab7c9dd` | fix(design): aplica Container conforme regra 8.4 em receive e send |
| `f858547` | feat(design): cria AmountInput e aplica em receive/send |
| `9d0c21b` | feat(design): cria StepsGuide (padrão cards) e unifica bloco como-funciona |
| `6143f05` | feat(design): migra login e register (Grupo B parte 1) |
| `171dbfd` | feat(design): migra forgot-password/verify-email e cria templates de página (Grupo B completo) |
| `82e56f5` | feat(design): migra history e dashboard (Grupo C) |

---

*Documento atualizado em 2026-08-05 (sessão 5). Próxima sessão: Grupo D (pix-keys, payment-links, subaccounts, developers, settings).*
