# Flyerx - Riscos Técnicos e Pontos de Validação

## 12. Riscos Técnicos

### 12.1 Matriz de Riscos

| ID | Risco | Probabilidade | Impacto | Severidade | Mitigação |
|----|-------|---------------|---------|------------|-----------|
| R1 | Inconsistência de saldo | Baixa | Crítico | Alta | Double-entry ledger, reconciliação diária |
| R2 | Double-spending | Média | Crítico | Alta | Reserva de saldo com lock, idempotência |
| R3 | Falha na integração Eulen | Média | Alto | Alta | Circuit breaker, retry, fallback |
| R4 | Webhook não recebido | Alta | Alto | Alta | Polling como fallback, reprocessamento |
| R5 | Vazamento de dados | Baixa | Crítico | Alta | Criptografia, LGPD, audit logs |
| R6 | DDoS/Abuse | Média | Alto | Média | Rate limiting, WAF, CAPTCHA |
| R7 | Fraude financeira | Média | Crítico | Alta | KYC, limites, detecção de padrões |
| R8 | Indisponibilidade do provider | Média | Alto | Alta | Health check, alertas, comunicação |
| R9 | Escalabilidade insuficiente | Baixa | Médio | Média | Arquitetura escalável, load tests |
| R10 | Complexidade do Ledger | Média | Médio | Média | Documentação, testes, revisão de código |

### 12.2 Detalhamento dos Riscos Críticos

#### R1: Inconsistência de Saldo

**Descrição**: Saldo da wallet não corresponde ao ledger.

**Causas potenciais**:
- Bug no cálculo de saldo
- Transação parcialmente gravada
- Race condition em operações concorrentes

**Mitigações**:
1. Saldo NUNCA armazenado diretamente, sempre calculado
2. Transactions com SERIALIZABLE isolation
3. Reconciliação automatizada diária
4. Alertas para discrepâncias
5. Audit trail completo

```php
// Verificação de integridade
public function verifyIntegrity(Wallet $wallet): IntegrityReport
{
    $ledgerBalance = $this->ledger->getBalance($wallet->ledgerAccountId);
    $cachedBalance = $this->cache->getWalletBalance($wallet->id);

    if (!$ledgerBalance->equals($cachedBalance)) {
        $this->alert->critical('Balance mismatch', [
            'wallet_id' => $wallet->id,
            'ledger' => $ledgerBalance,
            'cached' => $cachedBalance
        ]);

        // Força refresh do cache
        $this->cache->refreshWalletBalance($wallet->id);
    }

    return new IntegrityReport($wallet, $ledgerBalance, $cachedBalance);
}
```

#### R2: Double-Spending

**Descrição**: Usuário consegue gastar o mesmo saldo duas vezes.

**Causas potenciais**:
- Requests concorrentes de saque
- Falha na reserva de saldo
- Timeout sem rollback

**Mitigações**:
1. Lock pessimista na wallet durante operações
2. Sistema de reservas com expiração
3. Idempotency keys em todas as operações
4. Validação de saldo dentro da transaction

```php
public function createWithdrawal(WithdrawalRequest $request): Withdrawal
{
    return DB::transaction(function () use ($request) {
        // Lock pessimista
        $wallet = $this->walletRepository->lockForUpdate($request->walletId);

        // Calcula saldo disponível (já considera reservas ativas)
        $balance = $this->balanceCalculator->getUsableBalance($wallet);

        $totalRequired = $request->amount->add($request->fee);

        if ($balance->isLessThan($totalRequired)) {
            throw new InsufficientBalanceException($balance, $totalRequired);
        }

        // Cria reserva atomicamente
        $reservation = $this->reservationService->reserve(
            wallet: $wallet,
            amount: $totalRequired,
            operationType: 'withdrawal',
            operationId: $request->idempotencyKey,
            expiresAt: now()->addHours(24)
        );

        // Cria withdrawal
        return $this->withdrawalRepository->create(
            new Withdrawal(
                // ...
                reservationId: $reservation->id
            )
        );
    }, 5); // 5 tentativas em caso de deadlock
}
```

#### R3: Falha na Integração Eulen

**Descrição**: API da Eulen indisponível ou retornando erros.

**Mitigações**:
1. Circuit Breaker (após 5 falhas, abre por 30s)
2. Retry com exponential backoff
3. Timeout configurável (30s default)
4. Fallback para filas (processar depois)
5. Alertas para equipe

```php
// Configuração de resiliência
return [
    'eulen' => [
        'timeout' => 30,
        'retry' => [
            'attempts' => 3,
            'delay' => 100, // ms
            'multiplier' => 2.0,
            'max_delay' => 5000,
        ],
        'circuit_breaker' => [
            'threshold' => 5,
            'recovery_time' => 30,
        ],
    ],
];
```

#### R4: Webhook Não Recebido

**Descrição**: Webhook do provider não chega ou falha no processamento.

**Mitigações**:
1. Polling periódico como fallback
2. Job scheduler para verificar pendentes
3. Reprocessamento de webhooks
4. Dead letter queue para falhas

```php
// Job de polling (executa a cada 5 minutos)
class SyncPendingDepositsJob implements ShouldQueue
{
    public function handle(): void
    {
        // Depósitos pendentes há mais de 2 minutos
        $pendingDeposits = $this->depositRepository->findPending(
            since: now()->subMinutes(30),
            olderThan: now()->subMinutes(2)
        );

        foreach ($pendingDeposits as $deposit) {
            try {
                $status = $this->provider->getDepositStatus($deposit->providerId);

                if ($status->hasChanged($deposit->providerStatus)) {
                    $this->depositService->updateStatus($deposit, $status);
                }
            } catch (ProviderException $e) {
                $this->logger->warning('Failed to sync deposit', [
                    'deposit_id' => $deposit->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }
}
```

---

## 13. Pontos de Validação da Documentação Eulen

### 13.1 Itens que Requerem Validação

| # | Item | Status | Documentação | Ação Necessária |
|---|------|--------|--------------|-----------------|
| 1 | Método de validação de assinatura do webhook | **INDEFINIDO** | Não encontrado | Contatar Eulen ou implementar verificação genérica |
| 2 | Lista completa de eventos de webhook | **PARCIAL** | Mencionado mas não detalhado | Documentar eventos conforme descobertos |
| 3 | Estrutura exata do payload de webhook | **INDEFINIDO** | Não documentado | Logar payloads reais e documentar |
| 4 | Configuração da URL de webhook | **INDEFINIDO** | Não encontrado | Provavelmente via painel Eulen |
| 5 | Política de retry de webhooks | **INDEFINIDO** | Não documentado | Implementar reprocessamento próprio |
| 6 | Rate limits da API | **INDEFINIDO** | Mencionado seção "API Limits" mas sem valores | Assumir conservador, monitorar |
| 7 | Formato do erro 4xx/5xx completo | **PARCIAL** | Estrutura básica documentada | Mapear todos os erros possíveis |
| 8 | Endpoint /withdraw completo | **PARCIAL** | Parâmetros básicos documentados | Confirmar campos obrigatórios |
| 9 | Ambiente sandbox | **MENCIONADO** | `sk_test_*` keys | Obter credenciais de teste |
| 10 | Webhook MED | **INDEFINIDO** | Mencionado mas não explicado | O que é MED? Quando disparado? |
| 11 | EUID vs taxNumber | **PARCIAL** | Ambos mencionados | Quando usar cada um? |
| 12 | delayDepixInHours | **DOCUMENTADO** | 1-720 horas | Para que serve o delay? |
| 13 | splitFee e splitAddress | **DOCUMENTADO** | Campos opcionais | Não aplicável ao nosso caso |
| 14 | Expiração do QR Code | **INDEFINIDO** | Não especificado | Assumir 30 min, confirmar |
| 15 | Limites de valor (min/max) | **DOCUMENTADO** | 1 - 10.000.000 centavos | R$ 0,01 a R$ 100.000 |

### 13.2 Suposições Documentadas

Quando a documentação é omissa, as seguintes suposições foram feitas:

| Suposição | Base | Risco |
|-----------|------|-------|
| Webhooks usam HMAC-SHA256 | Padrão da indústria | Médio - pode não validar |
| QR Code expira em 30 min | Padrão PIX | Baixo - tratamos expiração |
| Rate limit de 100 req/min | Conservador | Baixo - ajustável |
| Timeout de 30s | Padrão da indústria | Baixo |
| Retry máximo de 3x | Best practice | Baixo |

### 13.3 Estratégia de Mitigação para Documentação Incompleta

```php
// 1. Logging extensivo de todas as interações
class EulenInteractionLogger
{
    public function logRequest(string $endpoint, array $data, array $headers): void
    {
        Log::channel('eulen')->info('Request', [
            'endpoint' => $endpoint,
            'data' => $this->sanitize($data),
            'headers' => $this->sanitize($headers),
            'timestamp' => now()->toIso8601String()
        ]);
    }

    public function logResponse(int $status, array $body, float $duration): void
    {
        Log::channel('eulen')->info('Response', [
            'status' => $status,
            'body' => $body,
            'duration_ms' => $duration,
            'timestamp' => now()->toIso8601String()
        ]);
    }

    public function logWebhook(array $payload, array $headers): void
    {
        Log::channel('eulen')->info('Webhook received', [
            'payload' => $payload,
            'headers' => $headers,
            'timestamp' => now()->toIso8601String()
        ]);
    }
}

// 2. Configuração flexível para ajustes sem deploy
return [
    'eulen' => [
        // Todos os valores configuráveis via env
        'webhook_signature_header' => env('EULEN_WEBHOOK_SIG_HEADER', 'X-Signature'),
        'webhook_signature_algo' => env('EULEN_WEBHOOK_SIG_ALGO', 'sha256'),
        'qr_code_ttl_minutes' => env('EULEN_QR_TTL', 30),
        'rate_limit_per_minute' => env('EULEN_RATE_LIMIT', 100),
    ],
];

// 3. Feature flags para comportamentos incertos
return [
    'features' => [
        'eulen_webhook_validation' => env('FEATURE_EULEN_WEBHOOK_VALIDATION', false),
        'eulen_strict_status_mapping' => env('FEATURE_EULEN_STRICT_STATUS', false),
    ],
];
```

---

## 14. Checklist Pré-Produção

### 14.1 Segurança
- [ ] Penetration test realizado
- [ ] OWASP Top 10 verificado
- [ ] Dados sensíveis criptografados
- [ ] Secrets em vault seguro
- [ ] Rate limiting configurado
- [ ] WAF ativo
- [ ] Logs não contêm dados sensíveis

### 14.2 Resiliência
- [ ] Circuit breakers testados
- [ ] Timeouts configurados
- [ ] Retries com backoff
- [ ] Dead letter queues
- [ ] Graceful degradation

### 14.3 Monitoramento
- [ ] Métricas de negócio
- [ ] Alertas de erro
- [ ] Alertas de latência
- [ ] Alertas de disponibilidade
- [ ] Dashboard operacional

### 14.4 Financeiro
- [ ] Reconciliação automatizada
- [ ] Alertas de discrepância
- [ ] Audit trail completo
- [ ] Backup de dados
- [ ] Processo de rollback

### 14.5 Compliance
- [ ] LGPD implementada
- [ ] Termos de uso
- [ ] Política de privacidade
- [ ] Retenção de dados definida
- [ ] Processo de exclusão de dados

### 14.6 Documentação
- [ ] API documentada (OpenAPI)
- [ ] Runbook operacional
- [ ] Incident response plan
- [ ] Architecture decision records
- [ ] Onboarding de desenvolvedores

---

## 15. Decisões Arquiteturais (ADRs)

### ADR-001: Uso de Double-Entry Ledger

**Contexto**: Precisamos rastrear movimentações financeiras de forma auditável.

**Decisão**: Implementar ledger com partidas dobradas (double-entry).

**Consequências**:
- (+) Auditabilidade total
- (+) Saldo sempre consistente (calculado, não armazenado)
- (+) Histórico imutável
- (-) Maior complexidade de implementação
- (-) Mais registros no banco

### ADR-002: Abstração de Payment Provider

**Contexto**: Dependência atual da Eulen, possível troca futura.

**Decisão**: Criar camada de abstração com interfaces.

**Consequências**:
- (+) Desacoplamento do provider
- (+) Facilita testes (mock)
- (+) Permite múltiplos providers
- (-) Overhead de mapeamento
- (-) Nem todos os features mapeiam 1:1

### ADR-003: Vue 3 + Inertia para Admin

**Contexto**: Escolher stack do painel administrativo.

**Decisão**: Vue 3 + Inertia (não Nuxt).

**Razão**: Integração nativa com Laravel, menor complexidade, não precisa de SSR para admin interno.

### ADR-004: PostgreSQL como Banco Principal

**Contexto**: Escolher banco de dados relacional.

**Decisão**: PostgreSQL.

**Razão**: Suporte a JSONB, particionamento nativo, melhor para dados financeiros, UUIDs nativos.

### ADR-005: Saldo Calculado vs Armazenado

**Contexto**: Como manter o saldo da wallet.

**Decisão**: Saldo sempre calculado a partir do ledger, com view materializada para performance.

**Razão**: Impossibilita inconsistências, fonte única da verdade, auditabilidade.

---

## 16. Conclusão

Este documento apresenta a arquitetura completa da plataforma Flyerx. Os próximos passos após aprovação são:

1. **Setup do ambiente de desenvolvimento** (Fase 1.1)
2. **Implementação da autenticação** (Fase 1.5-1.7)
3. **Estrutura do Ledger** (Fase 2.1)
4. **Validação com Eulen** dos pontos indefinidos

A arquitetura foi projetada para:
- Escalar horizontalmente
- Trocar provider sem reescrever
- Manter auditabilidade total
- Garantir segurança financeira
- Permitir evolução incremental

**Aguardo sua aprovação para iniciar a implementação.**
