# Auditoria Completa — Flyerx

**Data:** 2026-08-07 (atualizado 2026-08-08)
**Sessão:** Auditoria de estado real do projeto + Correções de integração

---

## 1. Resumo Executivo

**Estado após correções:** Sistema **FUNCIONAL** em produção.

| Componente | Status | Observação |
|------------|--------|------------|
| Backend Laravel | ✅ Funcionando | Gateway Key via proxy |
| Frontend Vercel | ✅ Funcionando | Proxy configurado |
| Registro | ✅ Funcionando | Cria wallet automaticamente |
| Login | ✅ Funcionando | Permite login sem verificação de email (temporário) |
| Wallet | ✅ Funcionando | Saldo e limites retornados |
| Email | ⏳ Pendente | Serviço de email não configurado |
| Admin | ⏳ Pendente | Retrofit visual + integração |

---

## 2. URLs de Produção

| Componente | Plataforma | URL |
|------------|------------|-----|
| Frontend | Vercel | https://flyerx.vercel.app |
| API Laravel | Railway | https://api-production-b0fd6.up.railway.app |
| withdrawal-service | Railway | Rede interna (sem URL pública) |
| PostgreSQL | Railway | Rede interna |

---

## 3. Correções Aplicadas (Sessão 2026-08-08)

### 3.1 SESSION_DRIVER no Railway

**Problema:** Laravel configurado com `SESSION_DRIVER=database` mas tabela `sessions` não existia.

**Solução:** Alterado para `SESSION_DRIVER=file`.

```bash
railway variables --set SESSION_DRIVER=file
```

### 3.2 GATEWAY_API_KEY no Vercel

**Problema:** Variável estava vazia no Vercel, proxy não enviava a chave.

**Solução:** Configurada corretamente via CLI.

```bash
vercel env add GATEWAY_API_KEY production
# Valor: QcMRmaEnxBduzTsPTMi2pMW/3vVCL4Ajb3yxsd3qxTE=
```

### 3.3 Proxy Accept Header

**Problema:** Sem header `Accept: application/json`, Laravel retornava redirect 302 em vez de JSON.

**Solução:** Proxy sempre envia `Accept: application/json`.

```typescript
// apps/web/src/lib/api/proxy.ts
headers.set('Accept', 'application/json');
```

### 3.4 Login sem Verificação de Email (Temporário)

**Problema:** Usuários não conseguiam logar sem verificar email (que não é enviado por falta de SMTP).

**Solução:** Permitir login com status `pending` temporariamente.

```php
// api/app/Domain/Identity/Enums/UserStatus.php
public function canLogin(): bool
{
    // TODO: Reverter para apenas ACTIVE quando email estiver configurado
    return $this === self::ACTIVE || $this === self::PENDING;
}
```

### 3.5 Criação Automática de Wallet

**Problema:** Wallet não era criada no registro, usuários ficavam sem carteira.

**Solução:** Listener que cria wallet automaticamente no evento `UserRegistered`.

```php
// api/app/Application/Wallet/Listeners/CreateWalletOnUserRegistered.php
```

### 3.6 Tratamento de Erros no Frontend

**Problema:** Erros da API não eram exibidos corretamente, causando erro "Cannot read properties of undefined".

**Solução:** Melhorado tratamento de erros nas funções `register()` e `login()`.

```typescript
// apps/web/src/lib/api/auth.ts
catch (error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    const message = axiosError.response?.data?.message || 'Erro';
    throw new Error(message);
  }
  throw error;
}
```

---

## 4. Commits Realizados

```
5cbd2ee fix(wallet): corrige listener de criação de wallet
70feef8 fix(auth): cria wallet no registro e melhora tratamento de erros
f1f1cec feat(auth): permite login sem verificação de email (temporário)
3ffa701 fix(web): corrige registro de usuários
569f622 chore: trigger redeploy for env var fix
ebb0b7d chore: ignore .vercel folder
eb23d52 feat(auth): implementa registro simplificado sem CPF obrigatório
```

---

## 5. Configurações Atuais

### Vercel (apps/web)

| Variável | Configurada |
|----------|-------------|
| LARAVEL_API_URL | ✅ |
| GATEWAY_API_KEY | ✅ |
| INTERNAL_API_KEY | ✅ |
| EULEN_API_URL | ✅ |
| EULEN_API_TOKEN | ✅ |
| NEXT_PUBLIC_API_URL | ✅ |
| NEXT_PUBLIC_APP_URL | ✅ |
| NEXT_PUBLIC_MOCK_API | ✅ |

### Railway (api)

| Variável | Configurada |
|----------|-------------|
| GATEWAY_API_KEY | ✅ |
| SESSION_DRIVER | ✅ file |
| DATABASE_URL | ✅ |
| EULEN_API_TOKEN | ✅ |
| INTERNAL_API_KEY | ✅ |

---

## 6. Pendências

### Alta Prioridade

| Item | Descrição | Ação |
|------|-----------|------|
| Serviço de Email | Emails não são enviados | Configurar Resend/Mailgun/SES |
| Reverter canLogin | Login permite status pending | Reverter após configurar email |

### Média Prioridade

| Item | Descrição | Ação |
|------|-----------|------|
| Admin | Design desatualizado, usa mocks | Retrofit Nocturne + integração |
| Mobile | Estrutura criada, não atualizado | Atualizar após admin |

### Baixa Prioridade

| Item | Descrição | Ação |
|------|-----------|------|
| NEXT_PUBLIC_INTERNAL_API_KEY | Ainda existe no código | Remover (já há proxy) |

---

## 7. Fluxo Testado e Funcionando

```
1. Registro → POST /api/v1/auth/register
   ✅ Usuário criado
   ✅ Wallet criada automaticamente

2. Login → POST /api/v1/auth/login
   ✅ Tokens JWT retornados
   ✅ Funciona mesmo sem verificação de email

3. Wallet → GET /api/v1/wallet
   ✅ Saldo R$ 0,00
   ✅ Limites configurados
   ✅ can_deposit: true
   ✅ can_withdraw: true
```

---

## 8. CLIs Configurados

Para facilitar manutenção, os seguintes CLIs estão autenticados:

```bash
# GitHub
gh auth status  # pabloh4516

# Vercel
vercel whoami   # pablohenrique4516-1329
cd apps/web && vercel link  # projeto: flyerx

# Railway
railway whoami  # pablohenrique4516@gmail.com
railway link    # projeto: flyerx, serviço: api
```

### Comandos Úteis

```bash
# Ver logs Railway
railway logs

# Ver variáveis Railway
railway variables

# Ver variáveis Vercel
cd apps/web && vercel env ls

# Redeploy Railway
railway redeploy --yes

# Deploy Vercel
git push  # automático
```

---

## 9. Próximos Passos

1. **Configurar serviço de email** (Resend recomendado - free tier 100/dia)
2. **Reverter canLogin** para exigir verificação de email
3. **Testar depósito** (gerar QR Code via Eulen)
4. **Testar saque** (via withdrawal-service)
5. **Retrofit do Admin**

---

*Documento atualizado em 2026-08-08 após correções de integração.*
