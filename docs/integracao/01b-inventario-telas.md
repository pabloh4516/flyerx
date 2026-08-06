# Inventário de Dados das Telas — flyerx-web

**Gerado em:** 2026-08-06
**Fase:** 6, Passo 1b
**Fonte:** Análise de código de 14 telas (excluindo design-system showcase)
**Status:** Registro para decisões do Passo 2 — nada se altera

---

## Índice

1. [Dashboard](#1-dashboard)
2. [Receive (Receber PIX)](#2-receive-receber-pix)
3. [Send (Enviar PIX)](#3-send-enviar-pix)
4. [History (Extrato)](#4-history-extrato)
5. [Login](#5-login)
6. [Register](#6-register)
7. [Forgot-password](#7-forgot-password)
8. [Verify-email](#8-verify-email)
9. [Pix-keys](#9-pix-keys)
10. [Payment-links](#10-payment-links)
11. [Subaccounts](#11-subaccounts)
12. [Developers](#12-developers)
13. [Settings](#13-settings)
14. [Root (Redirect)](#14-root-redirect)
15. [Resumo Executivo](#15-resumo-executivo)

---

## 1. Dashboard

**Caminho:** `(main)/dashboard/page.tsx`

### 1.1 Dados Exibidos

| Dado | Classificação | Observação |
|------|---------------|------------|
| Nome do usuário | [REAL] | `user.name` via `useAuthStore` |
| Nível de verificação (badge) | [REAL] | `user.kycLevel` via `useAuthStore` |
| Saldo disponível | [REAL] | `balance.available` via `useBalance()` |
| Transações recentes (3) | [REAL] | `transactionsData.data` via `useTransactions()` |
| Entradas · hoje (R$ 4.820) | [MOCK] | Hardcoded: `todayIncome = 4820` |
| Saídas · hoje (R$ 1.648) | [MOCK] | Hardcoded: `todayOutcome = 1648` |
| + esta semana (R$ 3.172) | [MOCK] | Hardcoded: `weekGrowth = 3172` |
| "2 chaves cadastradas" | [MOCK] | Hardcoded |
| "recebeu 12 pagamentos esta semana" | [MOCK] | Hardcoded |
| "3 membros ativos" (quick action) | [MOCK] | Hardcoded em `quickActions` |
| Sparkline (gráfico) | [MOCK] | Array hardcoded: `[56,50,52,40,44,24,14]` |
| Saudação (Bom dia/tarde/noite) | [DERIVADO] | Calculado pela hora atual |
| Data atual | [DERIVADO] | `toLocaleDateString` |
| Status da transação | [REAL] | Via `statusBadge` sobre dados reais |

### 1.2 Fonte

| Dado Real | Endpoint | Contrato |
|-----------|----------|----------|
| Saldo | `GET /v1/wallet/balance` | `{ available: number }` |
| Transações | `GET /v1/wallet/history` | `{ data: Transaction[] }` |
| Usuário | Auth Store (login prévio) | `{ name, kycLevel }` |

| Dado Mock | Endpoint que DEVERIA alimentar | Status |
|-----------|-------------------------------|--------|
| Entradas/Saídas do dia | `GET /v1/wallet/history?period=today` | Requer agregação backend |
| Chaves cadastradas | - | [SEM BACKEND] |
| Pagamentos da semana | `GET /v1/wallet/history?period=week` | Requer agregação backend |

### 1.3 Estados Tratados

| Estado | Implementado? | Observação |
|--------|---------------|------------|
| Loading (skeleton) | **NÃO** | Dados aparecem abruptamente |
| Vazio (EmptyState) | **SIM** | Para transações: "Nenhuma transação encontrada" |
| Erro | **NÃO** | Sem tratamento de erro de API |

**Status de transação tratados:** COMPLETED, PENDING, PROCESSING, FAILED, CANCELLED, EXPIRED

**Status Eulen NÃO distinguidos no frontend:**
- `under_review` → mostra como "Processando" (mapeado para PROCESSING)
- `delayed` → mostra como "Processando"
- `will_refund` → não tratado
- `refunded` → não tratado no statusBadge

### 1.4 Dados Disponíveis Não Exibidos

| Campo Eulen | Onde poderia estar | Impacto |
|-------------|-------------------|---------|
| `payerName` | Coluna/detalhe da transação | Médio — contexto para o usuário |
| `end_to_end_id` | Detalhe da transação | Baixo — técnico |
| `receiptUrl` | Link no saque | Alto — comprovante oficial |
| Limites diário/mensal | Card de saldo | Médio — planejamento |

### 1.5 Ações

| Ação | Tipo | Observação |
|------|------|------------|
| Copiar link PIX | **FUNCIONAL** | `navigator.clipboard` |
| Ver extrato completo | **FUNCIONAL** | Link para `/history` |
| Quick actions (4) | **FUNCIONAL** | Links para páginas |
| Filtros Tudo/Entradas/Saídas | **DECORATIVO** | Badges visuais, não filtram |
| Ver recibo (click transação) | **FUNCIONAL** | Link para `/receipt/{id}` |
| Botão QR | **DECORATIVO** | Sem onClick |

---

## 2. Receive (Receber PIX)

**Caminho:** `(main)/receive/page.tsx`

### 2.1 Dados Exibidos

| Dado | Classificação | Observação |
|------|---------------|------------|
| Limites (min/max) | [REAL] | `limits.deposit` via `useFeesStore` |
| Taxas (fixa) | [REAL] | `feeConfig.deposit` via `useFeesStore` |
| Wallet padrão | [REAL] | `getDefaultWallet()` via `useFeesStore` |
| QR Code PIX (imagem) | [REAL] | `qrImageUrl` de mutation |
| Código copia e cola | [REAL] | `qrCopyPaste` de mutation |
| Status do depósito | [REAL] | Polling via `usePix2DepixDepositStatus` |
| Valor líquido | [DERIVADO] | `amount - fee` |
| Countdown expiração | [MOCK] | Hardcoded "24:00:00" (não atualiza) |

### 2.2 Fonte

| Operação | Endpoint | Contrato |
|----------|----------|----------|
| Criar depósito | `POST /v1/deposits` | Request: `{ amount }`, Response: `{ qr_code, copy_paste }` |
| Polling status | `GET /v1/deposits/{id}` | Response: `{ status }` |

### 2.3 Estados Tratados

| Estado | Implementado? | Observação |
|--------|---------------|------------|
| Loading | **PARCIAL** | Loader2 apenas no botão de submit |
| Vazio | N/A | Não aplicável |
| Erro | **PARCIAL** | toast.error, sem UI de erro |

**Status tratados:** `pending` → `depix_sent`

**Status Eulen NÃO distinguidos:**
- `under_review` — não mostra "em análise"
- `delayed` — não mostra tempo restante
- `will_refund` — não notifica devolução pendente
- `expired` — não tratado na UI

### 2.4 Dados Disponíveis Não Exibidos

| Campo Eulen | Onde poderia estar | Impacto |
|-------------|-------------------|---------|
| `payerName` | Confirmação pós-pagamento | Alto — confirma quem pagou |
| `payerTaxNumber` | Confirmação | Médio — compliance |
| `delayUntil` | Status bar (se delayed) | Médio — expectativa |
| `bankTxId` | Detalhe/comprovante | Baixo — técnico |

### 2.5 Ações

| Ação | Tipo | Observação |
|------|------|------------|
| Gerar QR Code PIX | **FUNCIONAL** | Mutation `useCreatePix2DepixDeposit` |
| Copiar código PIX | **FUNCIONAL** | `navigator.clipboard` |
| Novo PIX | **FUNCIONAL** | Reset de estado |
| Ver extrato | **FUNCIONAL** | Link |
| Voltar ao início | **FUNCIONAL** | Link |
| Atualizar | **DECORATIVO** | `onClick={() => {}}` |
| Ajuda (?) | **DECORATIVO** | Sem onClick |
| Configurações (⚙) | **DECORATIVO** | Sem onClick |

---

## 3. Send (Enviar PIX)

**Caminho:** `(main)/send/page.tsx`

### 3.1 Dados Exibidos

| Dado | Classificação | Observação |
|------|---------------|------------|
| Limites (min/max) | [REAL] | `limits.withdraw` via `useFeesStore` |
| Taxas (fixa + %) | [REAL] | `feeConfig.withdraw` via `useFeesStore` |
| Documento do usuário | [REAL] | `user.document`, `user.euid` via `useAuthStore` |
| Endereço de depósito | [REAL] | `depositAddress` de mutation |
| Status do saque | [REAL] | Polling via `usePix2DepixWithdrawStatus` |
| Taxa calculada | [DERIVADO] | `partnerFixedFee + (amount * partnerPercentFee)` |

### 3.2 Fonte

| Operação | Endpoint | Contrato |
|----------|----------|----------|
| Criar saque | `POST /v1/withdrawals` | Request: `{ amount, pix_key, pix_key_type }` |
| Polling status | `GET /v1/withdrawals/{id}` | Response: `{ status }` |

### 3.3 Estados Tratados

| Estado | Implementado? | Observação |
|--------|---------------|------------|
| Loading | **PARCIAL** | Loader2 no botão |
| Vazio | N/A | Não aplicável |
| Erro | **PARCIAL** | toast.error |

**Status tratados:** `unsent` → `sent`

**Status Eulen NÃO distinguidos:**
- `sending` — não mostra "processando banco"
- `error` — não mostra motivo
- `refunded` — não notifica devolução

### 3.4 Dados Disponíveis Não Exibidos

| Campo Eulen | Onde poderia estar | Impacto |
|-------------|-------------------|---------|
| `receiptUrl` | Tela de confirmação | **ALTO** — comprovante oficial |
| `centralBankId` (E2E ID) | Comprovante | **ALTO** — prova do PIX |
| `receiverName` | Confirmação | Médio — verificação |
| `transferDate` | Comprovante | Médio — registro |

### 3.5 Ações

| Ação | Tipo | Observação |
|------|------|------------|
| Pagar PIX | **FUNCIONAL** | Mutation `useCreatePix2DepixWithdraw` |
| Copiar endereço | **FUNCIONAL** | `navigator.clipboard` |
| Novo PIX | **FUNCIONAL** | Reset de estado |
| Ver extrato | **FUNCIONAL** | Link |
| Voltar ao início | **FUNCIONAL** | Link |
| Atualizar | **DECORATIVO** | `onClick={() => {}}` |

---

## 4. History (Extrato)

**Caminho:** `(main)/history/page.tsx`

### 4.1 Dados Exibidos

| Dado | Classificação | Observação |
|------|---------------|------------|
| Lista de transações | [MOCK] | Array `mockTransactions` hardcoded |
| Total recebido | [DERIVADO] | Calculado sobre mocks |
| Total enviado | [DERIVADO] | Calculado sobre mocks |
| Contagem | [DERIVADO] | Calculado sobre mocks |

### 4.2 Fonte

| Dado Mock | Endpoint que DEVERIA alimentar |
|-----------|-------------------------------|
| Transações | `GET /v1/wallet/history` com paginação |
| Totais | Agregação backend ou frontend |

### 4.3 Estados Tratados

| Estado | Implementado? | Observação |
|--------|---------------|------------|
| Loading | **NÃO** | Dados hardcoded |
| Vazio | **IMPLÍCITO** | Tabela vazia se array vazio |
| Erro | **NÃO** | Sem tratamento |

**Status tratados:** COMPLETED, PENDING, FAILED (apenas 3 de 7 do Laravel)

**Status NÃO tratados:** PROCESSING, CANCELLED, EXPIRED, AWAITING_PAYMENT

### 4.4 Dados Disponíveis Não Exibidos

| Campo | Onde poderia estar | Impacto |
|-------|-------------------|---------|
| `payerName` | Coluna ou expandido | Alto |
| `end_to_end_id` | Coluna ou modal | Médio |
| `receiptUrl` | Link "Ver comprovante" | Alto |
| Status intermediários | Badge mais detalhado | Médio |

### 4.5 Ações

| Ação | Tipo | Observação |
|------|------|------------|
| Busca (ID/descrição/chave) | **FUNCIONAL** | Mas sobre mocks! |
| Filtro Todas/Recebidas/Enviadas | **FUNCIONAL** | Mas sobre mocks! |
| Filtros avançados | **DECORATIVO** | Botão sem implementação |
| Últimos 30 dias | **DECORATIVO** | Botão sem implementação |
| Exportar | **DECORATIVO** | Botão sem implementação |
| Paginação | **DECORATIVO** | Botões disabled |

---

## 5. Login

**Caminho:** `(auth)/login/page.tsx`

### 5.1 Dados Exibidos

| Dado | Classificação | Observação |
|------|---------------|------------|
| Nenhum dado carregado | - | Formulário em branco |

### 5.2 Fonte

| Operação | Endpoint |
|----------|----------|
| Login | `POST /v1/auth/login` |
| Verificar 2FA | `POST /v1/auth/2fa/verify` |

### 5.3 Estados Tratados

| Estado | Implementado? | Observação |
|--------|---------------|------------|
| Loading | **SIM** | Loader2 no botão, `isCheckingAuth` |
| Erro | **SIM** | toast.error com mensagem da API |
| Steps | **SIM** | email → password → 2fa |

### 5.4 Ações

| Ação | Tipo | Observação |
|------|------|------------|
| Continuar (email) | **FUNCIONAL** | Validação local |
| Entrar (senha) | **FUNCIONAL** | Mutation `login` |
| Verificar 2FA | **FUNCIONAL** | Mutation `verifyTwoFactor` |
| Entrar com biometria | **DECORATIVO** | Sem implementação |
| Voltar | **FUNCIONAL** | Muda step |
| Links (register, forgot) | **FUNCIONAL** | Next.js Link |

---

## 6. Register

**Caminho:** `(auth)/register/page.tsx`

### 6.1 Dados Exibidos

| Dado | Classificação | Observação |
|------|---------------|------------|
| Nenhum dado carregado | - | Formulário em branco |

### 6.2 Fonte

| Operação | Endpoint |
|----------|----------|
| Cadastro | `POST /v1/auth/register` |

### 6.3 Estados Tratados

| Estado | Implementado? | Observação |
|--------|---------------|------------|
| Loading | **SIM** | Loader2 no botão |
| Erro | **SIM** | toast.error |
| Steps | **SIM** | step 1 (dados) → step 2 (senha) |
| Validação | **SIM** | Zod + react-hook-form |

### 6.4 Ações

| Ação | Tipo | Observação |
|------|------|------------|
| Continuar | **FUNCIONAL** | Validação + muda step |
| Criar conta | **FUNCIONAL** | Mutation `apiRegister` |
| Voltar | **FUNCIONAL** | Muda step |
| Link para login | **FUNCIONAL** | Link |
| Links Termos/Privacidade | **FUNCIONAL** | Link |

---

## 7. Forgot-password

**Caminho:** `(auth)/forgot-password/page.tsx`

### 7.1 Dados Exibidos

| Dado | Classificação | Observação |
|------|---------------|------------|
| Email enviado | [DERIVADO] | Estado local `sentEmail` |

### 7.2 Fonte

| Operação | Endpoint |
|----------|----------|
| Solicitar reset | `POST /v1/auth/password/forgot` |

### 7.3 Estados Tratados

| Estado | Implementado? | Observação |
|--------|---------------|------------|
| Loading | **SIM** | Loader2 |
| Sucesso | **SIM** | Tela de confirmação |
| Erro | **SILENCIOSO** | Mostra sucesso por segurança |

### 7.4 Ações

| Ação | Tipo | Observação |
|------|------|------------|
| Enviar link | **FUNCIONAL** | Mutation `forgotPassword` |
| Tentar outro email | **FUNCIONAL** | Reset estado |
| Voltar para login | **FUNCIONAL** | Link |

---

## 8. Verify-email

**Caminho:** `(auth)/verify-email/page.tsx`

### 8.1 Dados Exibidos

| Dado | Classificação | Observação |
|------|---------------|------------|
| Token (da URL) | [REAL] | `searchParams.get('token')` |
| Mensagem de erro | [REAL] | Da API ou default |

### 8.2 Fonte

| Operação | Endpoint |
|----------|----------|
| Verificar | `GET /v1/email/verify/{id}/{token}` |

### 8.3 Estados Tratados

| Estado | Implementado? | Observação |
|--------|---------------|------------|
| Loading | **SIM** | Tela dedicada com Loader2 |
| Sucesso | **SIM** | Tela com CheckCircle verde |
| Erro | **SIM** | Tela com XCircle vermelho + mensagem |

### 8.4 Ações

| Ação | Tipo | Observação |
|------|------|------------|
| Ir para login | **FUNCIONAL** | Link |

---

## 9. Pix-keys

**Caminho:** `(main)/pix-keys/page.tsx`

### 9.1 Dados Exibidos

| Dado | Classificação | Observação |
|------|---------------|------------|
| Lista de chaves | [MOCK] | Array `mockPixKeys` hardcoded |
| Contagem de chaves | [DERIVADO] | `mockPixKeys.length` |

### 9.2 Fonte

| Dado Mock | Endpoint que DEVERIA alimentar | Status Backend |
|-----------|-------------------------------|----------------|
| Chaves PIX | - | **[SEM BACKEND]** — Domínio não existe no Laravel |

> **NOTA:** O Laravel não expõe endpoints de cadastro/listagem de chaves PIX. O sistema atual usa apenas chaves informadas nos saques, sem persistência.

### 9.3 Estados Tratados

| Estado | Implementado? | Observação |
|--------|---------------|------------|
| Loading | **NÃO** | Dados hardcoded |
| Vazio | **SIM** | EmptyState com CTA |
| Erro | **NÃO** | Sem tratamento |

### 9.4 Ações

| Ação | Tipo | Observação |
|------|------|------------|
| Cadastrar chave | **DECORATIVO** | Botão sem implementação |
| Copiar chave | **FUNCIONAL** | `navigator.clipboard` |
| Tornar principal | **DECORATIVO** | Menu sem implementação |
| Excluir chave | **DECORATIVO** | Menu sem implementação |

---

## 10. Payment-links

**Caminho:** `(main)/payment-links/page.tsx`

### 10.1 Dados Exibidos

| Dado | Classificação | Observação |
|------|---------------|------------|
| Lista de links | [MOCK] | Array `mockLinks` hardcoded |
| Links ativos | [DERIVADO] | Filtro sobre mocks |
| Total de usos | [DERIVADO] | Soma sobre mocks |
| Total recebido | [DERIVADO] | Soma sobre mocks |

### 10.2 Fonte

| Dado Mock | Endpoint que DEVERIA alimentar | Status Backend |
|-----------|-------------------------------|----------------|
| Links de pagamento | - | **[SEM BACKEND]** — Domínio não existe no Laravel |

> **NOTA:** Esta é uma tela-fachada. Não existe backend para links de pagamento.

### 10.3 Estados Tratados

| Estado | Implementado? | Observação |
|--------|---------------|------------|
| Loading | **NÃO** | Dados hardcoded |
| Vazio | **NÃO** | Sem EmptyState |
| Erro | **NÃO** | Sem tratamento |

### 10.4 Ações

| Ação | Tipo | Observação |
|------|------|------------|
| Novo link | **DECORATIVO** | Botão sem implementação |
| Copiar link | **FUNCIONAL** | `navigator.clipboard` |
| Abrir link | **DECORATIVO** | Menu sem implementação |
| Ver QR Code | **DECORATIVO** | Menu sem implementação |
| Editar | **DECORATIVO** | Menu sem implementação |
| Excluir | **DECORATIVO** | Menu sem implementação |

---

## 11. Subaccounts

**Caminho:** `(main)/subaccounts/page.tsx`

### 11.1 Dados Exibidos

| Dado | Classificação | Observação |
|------|---------------|------------|
| Lista de usuários | [MOCK] | Array `mockSubaccounts` hardcoded |
| Total de usuários | [DERIVADO] | `length` |
| Ativos | [DERIVADO] | Filtro sobre mocks |
| Pendentes | [DERIVADO] | Filtro sobre mocks |

### 11.2 Fonte

| Dado Mock | Endpoint que DEVERIA alimentar | Status Backend |
|-----------|-------------------------------|----------------|
| Subcontas | - | **[SEM BACKEND]** — Domínio não existe no Laravel |

> **NOTA:** Esta é uma tela-fachada. Não existe backend para subcontas.

### 11.3 Estados Tratados

| Estado | Implementado? | Observação |
|--------|---------------|------------|
| Loading | **NÃO** | Dados hardcoded |
| Vazio | **SIM** | EmptyState quando filtro não encontra |
| Erro | **NÃO** | Sem tratamento |

### 11.4 Ações

| Ação | Tipo | Observação |
|------|------|------------|
| Convidar usuário | **DECORATIVO** | Botão sem implementação |
| Busca | **FUNCIONAL** | Mas sobre mocks! |
| Editar permissões | **DECORATIVO** | Menu sem implementação |
| Resetar senha | **DECORATIVO** | Menu sem implementação |
| Remover acesso | **DECORATIVO** | Menu sem implementação |

---

## 12. Developers

**Caminho:** `(main)/developers/page.tsx`

### 12.1 Dados Exibidos

| Dado | Classificação | Observação |
|------|---------------|------------|
| Lista de API Keys | [MOCK] | Array `mockApiKeys` hardcoded |
| Lista de Webhooks | [MOCK] | Array `mockWebhooks` hardcoded |

### 12.2 Fonte

| Dado Mock | Endpoint que DEVERIA alimentar | Status Backend |
|-----------|-------------------------------|----------------|
| API Keys | - | **[SEM BACKEND]** — Domínio não existe no Laravel |
| Webhooks | - | **[SEM BACKEND]** — Webhooks de SAÍDA não implementados |

> **NOTA:** Esta é uma tela-fachada. Não existe backend para API keys de desenvolvedor.

### 12.3 Estados Tratados

| Estado | Implementado? | Observação |
|--------|---------------|------------|
| Loading | **NÃO** | Dados hardcoded |
| Vazio | **NÃO** | Sem EmptyState |
| Erro | **NÃO** | Sem tratamento |

### 12.4 Ações

| Ação | Tipo | Observação |
|------|------|------------|
| Nova chave | **DECORATIVO** | Botão sem implementação |
| Copiar chave | **FUNCIONAL** | `navigator.clipboard` |
| Mostrar/ocultar | **FUNCIONAL** | Toggle local |
| Rotacionar chave | **DECORATIVO** | Botão sem implementação |
| Deletar chave | **DECORATIVO** | Botão sem implementação |
| Novo webhook | **DECORATIVO** | Botão sem implementação |
| Deletar webhook | **DECORATIVO** | Botão sem implementação |
| Links docs/SDKs/sandbox | **DECORATIVO** | href="#" |

---

## 13. Settings

**Caminho:** `(main)/settings/page.tsx`

### 13.1 Dados Exibidos

| Dado | Classificação | Observação |
|------|---------------|------------|
| 2FA enabled | [REAL] | `user.twoFactorEnabled` via `useAuthStore` |
| Dados da empresa | [MOCK] | Estado local `businessData` hardcoded |
| Preferências de notificação | [MOCK] | Switches sem persistência |
| Cores/Logo | [MOCK] | Sem persistência |

### 13.2 Fonte

| Dado Real | Endpoint |
|-----------|----------|
| Status 2FA | `GET /v1/2fa/status` (via auth store) |

| Dado Mock | Endpoint que DEVERIA alimentar |
|-----------|-------------------------------|
| Dados empresa | `GET /v1/auth/me` (parcial) ou novo endpoint |
| Notificações | Novo endpoint de preferências |
| Aparência | Novo endpoint ou localStorage |

### 13.3 Estados Tratados

| Estado | Implementado? | Observação |
|--------|---------------|------------|
| Loading | **PARCIAL** | Apenas no salvar (simulado) |
| Erro | **NÃO** | Sem tratamento |
| Tabs | **SIM** | business / notifications / appearance |

### 13.4 Ações

| Ação | Tipo | Observação |
|------|------|------------|
| Salvar alterações | **DECORATIVO** | setTimeout mock, não persiste |
| Switches de notificação | **DECORATIVO** | Não persistem |
| Upload de logo | **DECORATIVO** | Sem implementação |
| Seleção de cor | **DECORATIVO** | Sem implementação |
| Toggle 2FA | **PARCIAL** | Mostra estado, não permite alterar |

---

## 14. Root (Redirect)

**Caminho:** `app/page.tsx`

### 14.1 Comportamento

| Tipo | Descrição |
|------|-----------|
| Redirect | `redirect('/login')` |

Não há dados, estados ou ações — apenas redirecionamento.

---

## 15. Resumo Executivo

### 15.1 Ranking por % de Mock

| # | Tela | % Mock | Classificação |
|---|------|--------|---------------|
| 1 | **payment-links** | 100% | Tela-fachada |
| 2 | **subaccounts** | 100% | Tela-fachada |
| 3 | **developers** | 100% | Tela-fachada |
| 4 | **pix-keys** | 100% | Tela-fachada |
| 5 | **history** | 100% | Mock (backend existe!) |
| 6 | **settings** | ~85% | Maioria mock |
| 7 | **dashboard** | ~50% | Saldo+transações real, resumos mock |
| 8 | **receive** | ~15% | Countdown mock, resto real |
| 9 | **send** | ~10% | Maioria real |
| 10 | **login** | 0% | 100% funcional |
| 11 | **register** | 0% | 100% funcional |
| 12 | **forgot-password** | 0% | 100% funcional |
| 13 | **verify-email** | 0% | 100% funcional |

### 15.2 Telas-Fachada (Sem Backend)

| Tela | Domínio | Observação |
|------|---------|------------|
| **payment-links** | Links de Pagamento | Não existe no Laravel |
| **subaccounts** | Subcontas/Multi-usuário | Não existe no Laravel |
| **developers** | API Keys + Webhooks de saída | Não existe no Laravel |
| **pix-keys** | Cadastro de chaves PIX | Não exposto no Laravel |

> Estas 4 telas funcionam 100% com dados mock. Implementar requer decisão de produto + desenvolvimento backend.

### 15.3 Top 10 Oportunidades de Conteúdo

Dados disponíveis no backend/Eulen que poderiam ser exibidos:

| # | Campo | Tela(s) | Impacto | Dificuldade | Observação |
|---|-------|---------|---------|-------------|------------|
| 1 | **receiptUrl** | send, history | **ALTO** | Baixa | Comprovante oficial do PIX |
| 2 | **centralBankId** (E2E) | send, history | **ALTO** | Baixa | Prova irrefutável do PIX |
| 3 | **payerName** | dashboard, receive, history | Alto | Baixa | Identifica quem pagou |
| 4 | **Resumos diários/semanais** | dashboard | Alto | Média | Requer agregação |
| 5 | **Status intermediários** | receive, send, history | Médio | Média | under_review, delayed, will_refund |
| 6 | **Limites dinâmicos** | dashboard, receive, send | Médio | Baixa | `/user-info` do Eulen |
| 7 | **delayUntil** | receive | Médio | Baixa | Quando delayed, mostra tempo |
| 8 | **transferDate** | send, history | Médio | Baixa | Data exata do PIX |
| 9 | **receiverName** | send | Médio | Baixa | Confirmação do destinatário |
| 10 | **Countdown real** | receive | Baixo | Média | Expiração do QR Code |

### 15.4 Estados Faltantes

| Tela | Loading | Vazio | Erro |
|------|---------|-------|------|
| dashboard | ❌ | ✅ | ❌ |
| receive | Parcial | N/A | Parcial |
| send | Parcial | N/A | Parcial |
| history | ❌ | Implícito | ❌ |
| pix-keys | ❌ | ✅ | ❌ |
| payment-links | ❌ | ❌ | ❌ |
| subaccounts | ❌ | ✅ | ❌ |
| developers | ❌ | ❌ | ❌ |
| settings | Parcial | N/A | ❌ |

### 15.5 Ações Decorativas (Botões sem Função)

| Tela | Ação | Motivo |
|------|------|--------|
| dashboard | Filtros Tudo/Entradas/Saídas | Só visual |
| dashboard | Botão QR | Sem onClick |
| receive | Atualizar | `onClick={() => {}}` |
| receive | Ajuda (?), Config (⚙) | Sem onClick |
| send | Atualizar | `onClick={() => {}}` |
| history | Exportar | Sem implementação |
| history | Filtro de data | Sem implementação |
| history | Filtros avançados | Sem implementação |
| history | Paginação | Buttons disabled |
| pix-keys | Todas as ações | Sem backend |
| payment-links | Todas as ações | Sem backend |
| subaccounts | Todas exceto busca | Sem backend |
| developers | Todas exceto copiar/toggle | Sem backend |
| settings | Salvar, switches, upload | Mock/não persiste |
| login | Entrar com biometria | Não implementado |

---

## Legenda

- **[REAL]**: Dado vem de API real
- **[MOCK]**: Dado hardcoded/estático no código
- **[DERIVADO]**: Calculado no frontend a partir de outros dados
- **[SEM BACKEND]**: Domínio não existe no Laravel
- **FUNCIONAL**: Ação conectada a algo real
- **DECORATIVO**: Ação visual sem efeito

---

---

## 16. Adendo: Funções de API Órfãs

*Adicionado em 2026-08-06 — Verificação Pré-Passo-2*

### 16.1 Análise de uso: lib/api/*.ts

#### lib/api/wallet.ts

| Função | Status | Hook que importa | Tela que usa |
|--------|--------|------------------|--------------|
| `getWallet` | ✅ USADA | `useWallet` | (hook disponível, não usado diretamente) |
| `getBalance` | ✅ USADA | `useBalance` | `dashboard/page.tsx` |
| `listTransactions` | ✅ USADA | `useTransactions` | `dashboard/page.tsx` |
| `getTransaction` | ⚠️ SEMI-ÓRFÃ | `useTransaction` | Nenhuma tela usa o hook |
| `exportTransactionsCsv` | ❌ ÓRFÃ | Nenhum | Botão "Exportar" em history é decorativo |
| `exportTransactionsPdf` | ❌ ÓRFÃ | Nenhum | Botão "Exportar" em history é decorativo |

#### lib/api/deposits.ts

| Função | Status | Hook que importa | Tela que usa |
|--------|--------|------------------|--------------|
| `createDeposit` | ⚠️ SEMI-ÓRFÃ | `useCreateDeposit` | Nenhuma — `receive/` usa Pix2Depix |
| `getDeposit` | ⚠️ SEMI-ÓRFÃ | `useDeposit` | Nenhuma tela usa o hook |
| `listDeposits` | ⚠️ SEMI-ÓRFÃ | `useDeposits` | Nenhuma tela usa o hook |
| `cancelDeposit` | ❌ ÓRFÃ | Nenhum | — |

#### lib/api/withdrawals.ts

| Função | Status | Hook que importa | Tela que usa |
|--------|--------|------------------|--------------|
| `estimateWithdrawalFee` | ⚠️ SEMI-ÓRFÃ | `useEstimateFee` | Nenhuma — taxa calculada localmente |
| `createWithdrawal` | ⚠️ SEMI-ÓRFÃ | `useCreateWithdrawal` | Nenhuma — `send/` usa Pix2Depix |
| `getWithdrawal` | ❌ ÓRFÃ | Nenhum | — |
| `listWithdrawals` | ⚠️ SEMI-ÓRFÃ | `useWithdrawals` | Nenhuma — `history/` usa mocks |
| `cancelWithdrawal` | ❌ ÓRFÃ | Nenhum | — |
| `validatePixKey` | ❌ ÓRFÃ | Nenhum | — |

#### lib/api/pix2depix.ts

| Função | Status | Hook que importa | Tela que usa |
|--------|--------|------------------|--------------|
| `createPix2DepixDeposit` | ✅ USADA | `useCreatePix2DepixDeposit` | `receive/page.tsx` |
| `getPix2DepixDepositStatus` | ✅ USADA | `usePix2DepixDepositStatus` | `receive/page.tsx` |
| `createPix2DepixWithdraw` | ✅ USADA | `useCreatePix2DepixWithdraw` | `send/page.tsx` |
| `getPix2DepixWithdrawStatus` | ✅ USADA | `usePix2DepixWithdrawStatus` | `send/page.tsx` |
| `getPix2DepixUserInfo` | ⚠️ SEMI-ÓRFÃ | `usePix2DepixUserInfo` | Nenhuma tela usa o hook |
| `isValidLiquidAddress` | ✅ USADA | — | Usado em validações |
| `isValidEUID` | ⚠️ SEMI-ÓRFÃ | — | Não encontrado em uso |
| `checkDailyLimit` | ⚠️ SEMI-ÓRFÃ | — | Não encontrado em uso |

#### lib/api/flyerx-backend.ts

| Função | Status | Hook que importa | Tela que usa |
|--------|--------|------------------|--------------|
| `getDevToken` | ⚠️ DEV-ONLY | — | Apenas para desenvolvimento |
| `hasBackendToken` | ⚠️ DEV-ONLY | — | — |
| `clearBackendToken` | ⚠️ DEV-ONLY | — | — |
| `createBackendWithdrawal` | ❌ ÓRFÃ | Nenhum | Backend LWK não ativado |
| `getBackendWithdrawal` | ❌ ÓRFÃ | Nenhum | — |
| `getBackendWithdrawalStatus` | ❌ ÓRFÃ | Nenhum | — |
| `listBackendWithdrawals` | ❌ ÓRFÃ | Nenhum | — |
| `cancelBackendWithdrawal` | ❌ ÓRFÃ | Nenhum | — |
| `estimateBackendFee` | ❌ ÓRFÃ | Nenhum | — |
| `getDailyLimit` | ✅ USADA | `useDailyLimit` | Hook disponível |
| `checkBackendHealth` | ⚠️ DEV-ONLY | — | — |
| `shouldUseBackendLWK` | ⚠️ FEATURE-FLAG | — | Controla fluxo |
| `setUseBackendLWK` | ⚠️ FEATURE-FLAG | — | — |

#### lib/api/auth.ts

| Status | Observação |
|--------|------------|
| ✅ TODAS USADAS | Sistema de auth funcional — login, register, 2FA, devices |

### 16.2 Resumo

| Classificação | Quantidade | Descrição |
|---------------|------------|-----------|
| ✅ USADA | 14 | Função chamada por tela real |
| ⚠️ SEMI-ÓRFÃ | 11 | Hook existe mas nenhuma tela usa |
| ❌ ÓRFÃ | 12 | Função sem import/uso |
| ⚠️ DEV/FLAG | 5 | Funções de desenvolvimento/feature flags |

### 16.3 Observações

1. **Fluxo duplo (Laravel vs Pix2Depix):**
   - `lib/api/deposits.ts` e `lib/api/withdrawals.ts` chamam API Laravel
   - `lib/api/pix2depix.ts` chama API Eulen diretamente via proxy Next.js
   - As telas `receive/` e `send/` usam **Pix2Depix**, não Laravel
   - As funções Laravel estão prontas mas órfãs por escolha de arquitetura

2. **Backend LWK (flyerx-backend/):**
   - `lib/api/flyerx-backend.ts` tem funções prontas
   - Feature flag `NEXT_PUBLIC_USE_BACKEND_LWK` controla ativação
   - Atualmente **desativado** — funções são órfãs

3. **History com mocks:**
   - `useTransactions`, `useWithdrawals`, `useDeposits` existem
   - `history/page.tsx` ignora e usa `mockTransactions` hardcoded
   - Integração seria simples: trocar mock por hook

---

*Documento gerado em 2026-08-06 como registro para decisões do Passo 2 da Fase 6.*
