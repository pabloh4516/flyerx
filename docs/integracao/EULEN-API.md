# Eulen Pix2DePix API - Referência

**SEMPRE CONSULTAR ANTES DE MODIFICAR CÓDIGO DE DEPÓSITO/SAQUE**

## Links da Documentação

### Visão Geral
- [API Overview](https://docs.eulen.app/-api-overview-782111m0.md)
- [Authentication](https://docs.eulen.app/-authentication-781855m0.md)
- [Examples](https://docs.eulen.app/-examples-783935m0.md)
- [Webhook](https://docs.eulen.app/-webhook-849106m0.md)

### Status
- [Deposit Statuses](https://docs.eulen.app/-deposit-statuses-1443187m0.md)
- [Withdraw Statuses](https://docs.eulen.app/-withdraw-statuses-1966899m0.md)

### Segurança
- [Best Practices](https://docs.eulen.app/-best-practices-782734m0.md)
- [Firewall](https://docs.eulen.app/-firewall-823355m0.md)
- [API Limits](https://docs.eulen.app/-api-limits-823358m0.md)

### Avançado
- [Nonce (Idempotência)](https://docs.eulen.app/-nonce-782110m0.md)
- [Sync / Async call](https://docs.eulen.app/-sync-async-call-781991m0.md)
- [QR Delay](https://docs.eulen.app/%EF%B8%8F-qr-delay-2048965m0.md)

## Endpoints

### Deposit (PIX → DePix)
- [POST /deposit](https://docs.eulen.app/deposit-pix-depix-12532107e0.md)
- [GET /deposit-status](https://docs.eulen.app/deposit-status-12667971e0.md)
- [GET /deposits](https://docs.eulen.app/deposits-20408160e0.md)

### Withdraw (DePix → PIX)
- [POST /withdraw](https://docs.eulen.app/withdraw-25979382e0.md)
- [GET /withdraw-status](https://docs.eulen.app/withdraw-status-25979384e0.md)

### Outros
- [GET /ping](https://docs.eulen.app/ping-12521558e0.md)
- [GET /user-info](https://docs.eulen.app/user-info-21725604e0.md)

## Schemas Importantes

### Deposit
- [DepositRequest](https://docs.eulen.app/depositrequest-4527919d0.md)
- [DepositResponse](https://docs.eulen.app/depositresponse-4530503d0.md)
- [DepositObj](https://docs.eulen.app/depositobj-4528879d0.md)
- [DepositStatusObj](https://docs.eulen.app/depositstatusobj-4663203d0.md)
- [DepositWebhookBody](https://docs.eulen.app/depositwebhookbody-5517307d0.md)

### Withdraw
- [WithdrawObj](https://docs.eulen.app/withdrawobj-11843531d0.md)
- [WithdrawResponse](https://docs.eulen.app/withdrawresponse-11843530d0.md)
- [WithdrawStatusObj](https://docs.eulen.app/withdrawstatusobj-11843344d0.md)
- [WithdrawWebhookBody](https://docs.eulen.app/withdrawwebhookbody-13016756d0.md)

### Outros
- [UserInfoResponse](https://docs.eulen.app/userinforesponse-9624477d0.md)
- [ErrorResponse](https://docs.eulen.app/errorresponse-4527417d0.md)
- [RejectionReasons](https://docs.eulen.app/rejectionreasons-16929571d0.md)

---

## Resumo dos Campos

### POST /deposit
```json
{
  "amountInCents": 10000,           // Obrigatório - valor em centavos
  "endUserTaxNumber": "12345678900", // Obrigatório - CPF/CNPJ do pagador
  "depixAddress": "lq1...",          // Opcional - endereço Liquid destino
  "euid": "EU123456789012345",       // Opcional - ID do usuário na Eulen
  "endUserFullName": "Nome",         // Opcional - nome do pagador
  "depixSplitAddress": "lq1...",     // Opcional - endereço para split
  "splitFee": "0.02",                // Opcional - % do split (2%)
  "delayDepixInHours": 24            // Opcional - delay 1-720 horas
}
```

### POST /withdraw
```json
{
  "pixKey": "email@example.com",     // Obrigatório - chave PIX destino
  "taxNumber": "12345678900",        // Obrigatório* - CPF/CNPJ (* ou euid)
  "euid": "EU123456789012345",       // Obrigatório* - EUID (* ou taxNumber)
  "payoutAmountInCents": 10000,      // Obrigatório** - valor a receber
  "depositAmountInCents": 10500      // Obrigatório** - valor a enviar DePix
}
// ** Informar apenas UM dos valores de amount
```

### Webhook Authentication
A Eulen usa **Basic Auth** para webhooks:
```
Authorization: Basic base64(secret:)
```
O secret é o username, senha vazia.

---

## Arquivos do Projeto

### Backend (Laravel)
- `api/app/Infrastructure/Payment/Providers/EulenProvider.php` - Cliente da API
- `api/app/Domain/Payment/DTOs/CreateDepositRequest.php` - DTO de depósito
- `api/app/Domain/Payment/DTOs/CreateWithdrawalRequest.php` - DTO de saque
- `api/app/Application/Wallet/Services/DepositService.php` - Lógica de depósito
- `api/app/Application/Wallet/Services/WithdrawalService.php` - Lógica de saque
- `api/app/Http/Controllers/Api/V1/DepositController.php` - Controller depósito
- `api/app/Http/Controllers/Api/V1/WithdrawalController.php` - Controller saque
- `api/app/Http/Controllers/Api/V1/WebhookController.php` - Webhooks

### Frontend (Next.js)
- `apps/web/src/lib/api/deposits.ts` - Chamadas de depósito
- `apps/web/src/lib/api/withdrawals.ts` - Chamadas de saque
- `apps/web/src/app/(main)/receive/page.tsx` - Página de depósito
- `apps/web/src/app/(main)/send/page.tsx` - Página de saque
