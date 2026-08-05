# Flyerx - Fluxogramas de Processos

## 5. Fluxogramas dos Processos Principais

### 5.1 Fluxo de Depósito PIX

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE DEPÓSITO PIX                                │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  INÍCIO  │
    └────┬─────┘
         │
         ▼
┌─────────────────┐
│ App: Solicita   │
│ depósito        │
│ (valor)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ API: Valida     │ NO  │ Retorna erro    │
│ - Usuário ativo?├────▶│ de validação    │
│ - KYC ok?       │     └─────────────────┘
│ - Limites ok?   │
└────────┬────────┘
         │ YES
         ▼
┌─────────────────┐
│ Gera            │
│ idempotency_key │
│ (UUID)          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Calcula taxa    │
│ aplicável       │
│ (FeeCalculator) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cria registro   │
│ deposits        │
│ status=pending  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Eulen: POST     │     │ Circuit Breaker │
│ /deposit        │ ERR │ - Retry 3x      │
│ {amount,        ├────▶│ - Timeout 30s   │
│  taxNumber}     │     │ - Fallback      │
└────────┬────────┘     └────────┬────────┘
         │ OK                    │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Recebe:         │     │ Marca deposit   │
│ - qrCopyPaste   │     │ status=failed   │
│ - qrImageUrl    │     │ Log erro        │
│ - id (provider) │     └────────┬────────┘
└────────┬────────┘              │
         │                       │
         ▼                       │
┌─────────────────┐              │
│ Atualiza        │              │
│ deposit com     │              │
│ dados do QR     │              │
└────────┬────────┘              │
         │                       │
         ▼                       │
┌─────────────────┐              │
│ Agenda Job:     │              │
│ CheckDeposit    │              │
│ (polling)       │              │
└────────┬────────┘              │
         │                       │
         ▼                       │
┌─────────────────┐              │
│ Retorna QR      │              │
│ Code para app   │◀─────────────┘
└────────┬────────┘
         │
         ▼
    ┌──────────┐
    │   FIM    │
    │ (FASE 1) │
    └──────────┘

═══════════════════════════════════════════════════════════════════════════════

                    WEBHOOK OU POLLING DE STATUS

    ┌──────────────┐
    │ Webhook      │
    │ recebido     │
    │ OU           │
    │ Polling job  │
    └──────┬───────┘
           │
           ▼
┌─────────────────┐     ┌─────────────────┐
│ Valida webhook  │ NO  │ Log webhook     │
│ - Signature ok? ├────▶│ inválido        │
│ - Provider ok?  │     │ Retorna 401     │
└────────┬────────┘     └─────────────────┘
         │ YES
         ▼
┌─────────────────┐
│ Busca deposit   │
│ por provider_id │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Status do       │
│ provider?       │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬───────────┐
    │         │            │           │
    ▼         ▼            ▼           ▼
┌───────┐ ┌───────┐ ┌──────────┐ ┌──────────┐
│pending│ │approved│ │under_    │ │expired/  │
│       │ │       │ │review    │ │refunded  │
└───┬───┘ └───┬───┘ └────┬─────┘ └────┬─────┘
    │         │          │            │
    │         │          │            ▼
    │         │          │      ┌──────────┐
    │         │          │      │ Marca    │
    │         │          │      │ failed/  │
    │         │          │      │ expired  │
    │         │          │      └────┬─────┘
    │         │          │           │
    │         │          ▼           │
    │         │    ┌──────────┐      │
    │         │    │ Aguarda  │      │
    │         │    │ próximo  │      │
    │         │    │ webhook  │      │
    │         │    └────┬─────┘      │
    │         │         │            │
    │         ▼         │            │
    │   ┌──────────┐    │            │
    │   │ CONFIRMA │    │            │
    │   │ DEPÓSITO │    │            │
    │   └────┬─────┘    │            │
    │        │          │            │
    │        ▼          │            │
    │  ┌───────────────┐│            │
    │  │ BEGIN         ││            │
    │  │ TRANSACTION   ││            │
    │  └───────┬───────┘│            │
    │          │        │            │
    │          ▼        │            │
    │  ┌───────────────┐│            │
    │  │ Cria Ledger   ││            │
    │  │ Transaction   ││            │
    │  │ + Entries     ││            │
    │  │ (double-entry)││            │
    │  └───────┬───────┘│            │
    │          │        │            │
    │          ▼        │            │
    │  ┌───────────────┐│            │
    │  │ Atualiza      ││            │
    │  │ deposit       ││            │
    │  │ status=       ││            │
    │  │ confirmed     ││            │
    │  └───────┬───────┘│            │
    │          │        │            │
    │          ▼        │            │
    │  ┌───────────────┐│            │
    │  │ Refresh       ││            │
    │  │ wallet        ││            │
    │  │ balance view  ││            │
    │  └───────┬───────┘│            │
    │          │        │            │
    │          ▼        │            │
    │  ┌───────────────┐│            │
    │  │ COMMIT        ││            │
    │  └───────┬───────┘│            │
    │          │        │            │
    │          ▼        │            │
    │  ┌───────────────┐│            │
    │  │ Dispatch      ││            │
    │  │ Events:       ││            │
    │  │ -DepositConf. ││            │
    │  │ -SendNotif.   ││            │
    │  └───────┬───────┘│            │
    │          │        │            │
    └──────────┴────────┴────────────┘
               │
               ▼
          ┌──────────┐
          │   FIM    │
          └──────────┘
```

---

### 5.2 Fluxo de Saque PIX

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO DE SAQUE PIX                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  INÍCIO  │
    └────┬─────┘
         │
         ▼
┌─────────────────┐
│ App: Solicita   │
│ saque           │
│ {valor,         │
│  pixKey,        │
│  taxNumber}     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ VALIDAÇÕES      │ NO  │ Retorna erro    │
│ - Usuário ativo?├────▶│ específico      │
│ - KYC aprovado? │     └─────────────────┘
│ - 2FA válido?   │
│ - Limites ok?   │
└────────┬────────┘
         │ YES
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Calcula saldo   │ NO  │ Erro:           │
│ disponível      ├────▶│ Saldo           │
│ (via Ledger)    │     │ insuficiente    │
│ Saldo >= valor? │     └─────────────────┘
└────────┬────────┘
         │ YES
         ▼
┌─────────────────┐
│ Calcula taxa    │
│ (valor + taxa   │
│ <= saldo?)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Valida chave    │
│ PIX             │
│ (formato,       │
│  taxNumber)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ BEGIN           │
│ TRANSACTION     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cria            │
│ balance_        │
│ reservation     │
│ (valor + taxa)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cria registro   │
│ withdrawals     │
│ status=reserved │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ COMMIT          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Valor >         │ YES │ Marca           │
│ threshold       ├────▶│ requires_       │
│ aprovação?      │     │ approval=true   │
└────────┬────────┘     │ status=pending_ │
         │ NO           │ approval        │
         │              └────────┬────────┘
         │                       │
         │              ┌────────▼────────┐
         │              │ Aguarda         │
         │              │ aprovação       │
         │              │ manual no       │
         │              │ painel admin    │
         │              └────────┬────────┘
         │                       │
         ◀───────────────────────┘
         │ (após aprovação ou se não precisar)
         ▼
┌─────────────────┐
│ Dispatch Job:   │
│ ProcessWithdraw │
│ (async)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Eulen: POST     │     │ Circuit Breaker │
│ /withdraw       │ ERR │ - Retry 3x      │
│ {pixKey,        ├────▶│ - Timeout 30s   │
│  amount,        │     └────────┬────────┘
│  taxNumber}     │              │
└────────┬────────┘              │
         │ OK                    ▼
         │              ┌─────────────────┐
         │              │ ESTORNO         │
         │              │ AUTOMÁTICO      │
         │              └────────┬────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         │              │ Libera reserva  │
         │              │ Marca failed    │
         │              │ Notifica user   │
         │              └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Atualiza        │
│ withdrawal      │
│ status=         │
│ processing      │
│ + provider_id   │
└────────┬────────┘
         │
         ▼
    ┌──────────┐
    │   FIM    │
    │ (FASE 1) │
    └──────────┘

═══════════════════════════════════════════════════════════════════════════════

                    WEBHOOK DE CONFIRMAÇÃO

    ┌──────────────┐
    │ Webhook      │
    │ recebido     │
    └──────┬───────┘
           │
           ▼
┌─────────────────┐
│ Valida webhook  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Status do       │
│ provider?       │
└────────┬────────┘
         │
    ┌────┴────┬────────────┐
    │         │            │
    ▼         ▼            ▼
┌───────┐ ┌───────┐ ┌──────────┐
│sent   │ │sending│ │failed/   │
│(ok)   │ │(wait) │ │cancelled │
└───┬───┘ └───┬───┘ └────┬─────┘
    │         │          │
    ▼         │          ▼
┌─────────────┐│    ┌──────────────┐
│ BEGIN TRANS.││    │ ESTORNO      │
└─────┬───────┘│    └──────┬───────┘
      │        │           │
      ▼        │           ▼
┌─────────────┐│    ┌──────────────┐
│ Consome     ││    │ Libera       │
│ reserva     ││    │ reserva      │
│ (consumed)  ││    │ (released)   │
└─────┬───────┘│    └──────┬───────┘
      │        │           │
      ▼        │           ▼
┌─────────────┐│    ┌──────────────┐
│ Cria Ledger ││    │ Marca        │
│ Transaction ││    │ withdrawal   │
│ (débito da  ││    │ status=      │
│ carteira)   ││    │ refunded     │
└─────┬───────┘│    └──────┬───────┘
      │        │           │
      ▼        │           ▼
┌─────────────┐│    ┌──────────────┐
│ Marca       ││    │ Cria Ledger  │
│ withdrawal  ││    │ de estorno   │
│ confirmed   ││    │ (se houve    │
└─────┬───────┘│    │  débito)     │
      │        │    └──────┬───────┘
      ▼        │           │
┌─────────────┐│           │
│ COMMIT      ││           │
└─────┬───────┘│           │
      │        │           │
      ▼        │           │
┌─────────────┐│           │
│ Notifica    ││           │
│ usuário     │◀───────────┘
└─────┬───────┘
      │
      ▼
 ┌──────────┐
 │   FIM    │
 └──────────┘
```

---

### 5.3 Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE AUTENTICAÇÃO                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  LOGIN   │
    └────┬─────┘
         │
         ▼
┌─────────────────┐
│ App: POST       │
│ /auth/login     │
│ {email,         │
│  password,      │
│  device_info}   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Rate Limit      │ NO  │ 429 Too Many    │
│ check           ├────▶│ Requests        │
│ (IP + email)    │     └─────────────────┘
└────────┬────────┘
         │ OK
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Busca user      │ NO  │ Log attempt     │
│ por email       ├────▶│ 401 Unauthorized│
└────────┬────────┘     └─────────────────┘
         │ FOUND
         ▼
┌─────────────────┐     ┌─────────────────┐
│ User locked?    │ YES │ 403 Conta       │
│ (failed_login   ├────▶│ bloqueada       │
│ > threshold)    │     │ temporariamente │
└────────┬────────┘     └─────────────────┘
         │ NO
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Verifica        │ NO  │ Incrementa      │
│ password        ├────▶│ failed_attempts │
│ (Argon2id)      │     │ 401 Unauthorized│
└────────┬────────┘     └─────────────────┘
         │ OK
         ▼
┌─────────────────┐
│ Reset           │
│ failed_attempts │
│ = 0             │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ 2FA enabled?    │ YES │ Retorna         │
├─────────────────┤     │ requires_2fa    │
│                 │     │ + session_token │
└────────┬────────┘     │ (parcial)       │
         │ NO           └────────┬────────┘
         │                       │
         │              ┌────────▼────────┐
         │              │ App: POST       │
         │              │ /auth/2fa/verify│
         │              │ {code,          │
         │              │  session_token} │
         │              └────────┬────────┘
         │                       │
         │              ┌────────▼────────┐
         │              │ Valida TOTP     │
         │              │ code            │
         │              └────────┬────────┘
         │                       │
         ◀───────────────────────┘
         │
         ▼
┌─────────────────┐
│ Verifica/cria   │
│ device          │
│ (fingerprint)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Device          │ YES │ Requer          │
│ trusted?        ├────▶│ verificação?    │
│                 │ NO  │ (email/sms)     │
└────────┬────────┘     └─────────────────┘
         │ YES (ou após verificar)
         ▼
┌─────────────────┐
│ Cria session    │
│ - JWT token     │
│ - Refresh token │
│ - Expiration    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Atualiza user   │
│ - last_login_at │
│ - last_login_ip │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Log audit       │
│ (login success) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Retorna:        │
│ - access_token  │
│ - refresh_token │
│ - expires_in    │
│ - user_data     │
└────────┬────────┘
         │
         ▼
    ┌──────────┐
    │   FIM    │
    └──────────┘
```

---

### 5.4 Fluxo de KYC

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUXO DE KYC                                       │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ User inicia  │
    │ KYC Level N  │
    └──────┬───────┘
           │
           ▼
┌─────────────────┐     ┌─────────────────┐
│ Nível atual     │ NO  │ Erro: complete  │
│ é N-1?          ├────▶│ nível anterior  │
└────────┬────────┘     └─────────────────┘
         │ YES
         ▼
┌─────────────────┐
│ Cria            │
│ kyc_process     │
│ status=pending  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Retorna lista   │
│ de documentos   │
│ necessários     │
└────────┬────────┘
         │
         ▼
    ╔═════════════╗
    ║  LEVEL 1    ║
    ║ - Nome      ║
    ║ - CPF       ║
    ║ - Data nasc ║
    ║ - Email     ║
    ╠═════════════╣
    ║  LEVEL 2    ║
    ║ + Doc frente║
    ║ + Doc verso ║
    ║ + Selfie    ║
    ╠═════════════╣
    ║  LEVEL 3    ║
    ║ + Comp.     ║
    ║   endereço  ║
    ║ + Comp.     ║
    ║   renda     ║
    ╚═════════════╝
         │
         ▼
┌─────────────────┐
│ User envia      │
│ documentos      │
│ (upload seguro) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Para cada doc:  │
│ - Valida formato│
│ - Gera hash     │
│ - Criptografa   │
│ - Salva S3      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Todos docs      │
│ enviados?       │
└────────┬────────┘
         │ YES
         ▼
┌─────────────────┐
│ Atualiza        │
│ kyc_process     │
│ status=submitted│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Notifica equipe │
│ de compliance   │
│ (in-app/email)  │
└────────┬────────┘
         │
         ▼
    ┌──────────────┐
    │   ANÁLISE    │
    │   (Admin)    │
    └──────┬───────┘
           │
           ▼
┌─────────────────┐
│ Admin revisa    │
│ cada documento  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│APROVAR│ │REJEITAR│
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌─────────┐ ┌─────────────┐
│ Atualiza│ │ Marca docs  │
│ user.   │ │ rejeitados  │
│ kyc_    │ │ + motivo    │
│ level=N │ │             │
└────┬────┘ └──────┬──────┘
     │             │
     ▼             ▼
┌─────────┐ ┌─────────────┐
│ Atualiza│ │ Permite novo│
│ limites │ │ envio       │
│ (auto)  │ │             │
└────┬────┘ └──────┬──────┘
     │             │
     └──────┬──────┘
            │
            ▼
┌─────────────────┐
│ Notifica user   │
│ (push + email)  │
└────────┬────────┘
         │
         ▼
    ┌──────────┐
    │   FIM    │
    └──────────┘
```

---

### 5.5 Diagrama de Estados - Depósito

```
                    ┌─────────────────────────────────────┐
                    │        ESTADOS DO DEPÓSITO          │
                    └─────────────────────────────────────┘

                              ┌─────────┐
                              │ pending │ (QR gerado, aguardando pagamento)
                              └────┬────┘
                                   │
                         ┌─────────┼─────────┐
                         │         │         │
                         ▼         ▼         ▼
                   ┌──────────┐ ┌─────────┐ ┌─────────┐
                   │processing│ │ expired │ │  failed │
                   │(provider │ │(timeout)│ │(API err)│
                   │recebeu)  │ └─────────┘ └─────────┘
                   └────┬─────┘      ▲           ▲
                        │            │           │
              ┌─────────┼─────────┐  │           │
              │         │         │  │           │
              ▼         ▼         │  │           │
        ┌──────────┐ ┌──────────┐ │  │           │
        │ approved │ │under_    │ │  │           │
        │(PIX ok,  │ │review    ├─┘  │           │
        │aguardando│ │(análise) │    │           │
        │confirm)  │ └─────┬────┘    │           │
        └────┬─────┘       │         │           │
             │             │         │           │
             │      ┌──────┴─────────┴───────────┘
             │      │
             ▼      ▼
        ┌───────────────┐
        │   confirmed   │ (creditado na wallet)
        │   [TERMINAL]  │
        └───────────────┘


    Estados Terminais: confirmed, expired, failed, refunded
```

---

### 5.6 Diagrama de Estados - Saque

```
                    ┌─────────────────────────────────────┐
                    │         ESTADOS DO SAQUE            │
                    └─────────────────────────────────────┘

                              ┌─────────┐
                              │ pending │ (criado, validando)
                              └────┬────┘
                                   │
                                   ▼
                              ┌─────────┐
                              │reserved │ (saldo reservado)
                              └────┬────┘
                                   │
                         ┌─────────┼─────────┐
                         │                   │
                         ▼                   ▼
                   ┌───────────┐       ┌──────────┐
                   │ pending_  │       │processing│
                   │ approval  │       │(enviado  │
                   │(valor alto)│      │ provider)│
                   └─────┬─────┘       └────┬─────┘
                         │                  │
                    ┌────┴────┐       ┌─────┼─────────┐
                    │         │       │     │         │
                    ▼         ▼       ▼     ▼         ▼
              ┌─────────┐ ┌───────┐ ┌─────────┐ ┌─────────┐
              │approved │ │rejected│ │confirmed│ │ failed  │
              │(admin ok)│ │(admin │ │[TERMINAL]│ │(provider│
              └────┬────┘ │ negou)│ └─────────┘ │  erro)  │
                   │      └───┬───┘              └────┬────┘
                   │          │                       │
                   │          ▼                       ▼
                   │    ┌───────────┐           ┌─────────┐
                   │    │ cancelled │           │refunded │
                   │    │[TERMINAL] │           │[TERMINAL]│
                   │    │(reserva   │           │(reserva │
                   │    │ liberada) │           │liberada)│
                   │    └───────────┘           └─────────┘
                   │
                   ▼
              (volta para processing)


    Estados Terminais: confirmed, cancelled, refunded, rejected
```
