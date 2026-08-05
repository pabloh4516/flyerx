# Flyerx - Estratégia de Integração com Eulen

## 8. Integração com Provider de Pagamento

### 8.1 Arquitetura de Desacoplamento

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CAMADA DE ABSTRAÇÃO DE PROVIDERS                         │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────┐
    │                    APPLICATION LAYER                         │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
    │  │ DepositSvc  │  │WithdrawalSvc│  │ WebhookSvc  │          │
    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
    └─────────┼────────────────┼────────────────┼─────────────────┘
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                   PROVIDER CONTRACTS                         │
    │  ┌─────────────────────────────────────────────────────┐    │
    │  │             PaymentProviderInterface                 │    │
    │  │  ├── DepositProviderInterface                       │    │
    │  │  ├── WithdrawalProviderInterface                    │    │
    │  │  └── WebhookHandlerInterface                        │    │
    │  └─────────────────────────────────────────────────────┘    │
    └──────────────────────────┬──────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
    │ EULEN PROVIDER  │ │   FUTURE    │ │     MOCK        │
    │ (Implementação  │ │  PROVIDER   │ │   PROVIDER      │
    │  atual)         │ │  (Ex: Pagar │ │   (Testes)      │
    │                 │ │   .me)      │ │                 │
    └─────────────────┘ └─────────────┘ └─────────────────┘
```

### 8.2 Interfaces do Provider

```php
<?php

namespace App\Infrastructure\Integration\PaymentProvider\Contracts;

interface PaymentProviderInterface
{
    public function getName(): string;
    public function isAvailable(): bool;
    public function getHealthStatus(): HealthStatus;
}

interface DepositProviderInterface extends PaymentProviderInterface
{
    /**
     * Cria um QR Code PIX para depósito
     */
    public function createDeposit(
        ProviderDepositRequest $request
    ): ProviderDepositResponse;

    /**
     * Consulta status de um depósito
     */
    public function getDepositStatus(
        string $providerId
    ): ProviderDepositStatus;

    /**
     * Lista depósitos em um período
     */
    public function listDeposits(
        DateTimeInterface $start,
        DateTimeInterface $end,
        ?string $status = null
    ): Collection;
}

interface WithdrawalProviderInterface extends PaymentProviderInterface
{
    /**
     * Solicita um saque PIX
     */
    public function createWithdrawal(
        ProviderWithdrawRequest $request
    ): ProviderWithdrawResponse;

    /**
     * Consulta status de um saque
     */
    public function getWithdrawalStatus(
        string $providerId
    ): ProviderWithdrawalStatus;
}

interface WebhookHandlerInterface
{
    /**
     * Valida assinatura do webhook
     */
    public function validateSignature(
        string $payload,
        string $signature,
        array $headers
    ): bool;

    /**
     * Processa payload do webhook
     */
    public function processWebhook(
        string $eventType,
        array $payload
    ): WebhookResult;

    /**
     * Retorna eventos suportados
     */
    public function getSupportedEvents(): array;
}
```

### 8.3 DTOs do Provider

```php
<?php

namespace App\Infrastructure\Integration\PaymentProvider\DTOs;

// Request de Depósito (normalizado)
class ProviderDepositRequest
{
    public function __construct(
        public readonly string $idempotencyKey,
        public readonly int $amountInCents,
        public readonly string $userTaxNumber,
        public readonly string $userName,
        public readonly ?string $userEuid = null,
        public readonly array $metadata = []
    ) {}
}

// Response de Depósito (normalizado)
class ProviderDepositResponse
{
    public function __construct(
        public readonly string $providerId,
        public readonly string $qrCodeText,
        public readonly string $qrCodeImageUrl,
        public readonly DateTimeInterface $expiresAt,
        public readonly string $status,
        public readonly array $rawResponse = []
    ) {}
}

// Request de Saque (normalizado)
class ProviderWithdrawRequest
{
    public function __construct(
        public readonly string $idempotencyKey,
        public readonly int $amountInCents,
        public readonly string $pixKey,
        public readonly string $pixKeyType,
        public readonly string $recipientTaxNumber,
        public readonly ?string $recipientName = null,
        public readonly array $metadata = []
    ) {}
}

// Response de Saque (normalizado)
class ProviderWithdrawResponse
{
    public function __construct(
        public readonly string $providerId,
        public readonly string $status,
        public readonly int $feeInCents,
        public readonly ?string $bankTxId = null,
        public readonly array $rawResponse = []
    ) {}
}

// Status normalizado
enum ProviderStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case CONFIRMED = 'confirmed';
    case FAILED = 'failed';
    case EXPIRED = 'expired';
    case REFUNDED = 'refunded';
    case CANCELLED = 'cancelled';
}
```

### 8.4 Implementação Eulen

```php
<?php

namespace App\Infrastructure\Integration\PaymentProvider\Eulen;

class EulenProvider implements DepositProviderInterface, WithdrawalProviderInterface
{
    public function __construct(
        private readonly EulenHttpClient $httpClient,
        private readonly EulenStatusMapper $statusMapper,
        private readonly EulenConfig $config,
        private readonly LoggerInterface $logger
    ) {}

    public function getName(): string
    {
        return 'eulen';
    }

    public function createDeposit(
        ProviderDepositRequest $request
    ): ProviderDepositResponse {

        $eulenRequest = new EulenDepositRequest(
            amountInCents: $request->amountInCents,
            endUserTaxNumber: $request->userTaxNumber,
            endUserFullName: $request->userName,
            euid: $request->userEuid
        );

        try {
            $response = $this->httpClient->post(
                endpoint: '/deposit',
                data: $eulenRequest->toArray(),
                headers: [
                    'X-Nonce' => $request->idempotencyKey,
                ]
            );

            return new ProviderDepositResponse(
                providerId: $response['response']['id'],
                qrCodeText: $response['response']['qrCopyPaste'],
                qrCodeImageUrl: $response['response']['qrImageUrl'],
                expiresAt: $this->calculateExpiration(),
                status: 'pending',
                rawResponse: $response
            );

        } catch (EulenApiException $e) {
            $this->logger->error('Eulen deposit failed', [
                'request' => $request,
                'error' => $e->getMessage()
            ]);
            throw new ProviderException($e->getMessage(), $e);
        }
    }

    public function createWithdrawal(
        ProviderWithdrawRequest $request
    ): ProviderWithdrawResponse {

        $eulenRequest = new EulenWithdrawRequest(
            pixKey: $request->pixKey,
            amountInCents: $request->amountInCents,
            taxNumber: $request->recipientTaxNumber
        );

        try {
            $response = $this->httpClient->post(
                endpoint: '/withdraw',
                data: $eulenRequest->toArray(),
                headers: [
                    'X-Nonce' => $request->idempotencyKey,
                ]
            );

            return new ProviderWithdrawResponse(
                providerId: $response['withdrawalId'],
                status: $this->statusMapper->mapWithdrawalStatus(
                    $response['status'] ?? 'unsent'
                ),
                feeInCents: $response['fee_cents'] ?? 0,
                rawResponse: $response
            );

        } catch (EulenApiException $e) {
            $this->logger->error('Eulen withdrawal failed', [
                'request' => $request,
                'error' => $e->getMessage()
            ]);
            throw new ProviderException($e->getMessage(), $e);
        }
    }

    public function getDepositStatus(string $providerId): ProviderDepositStatus
    {
        $response = $this->httpClient->get(
            endpoint: '/deposit-status',
            query: ['id' => $providerId]
        );

        return new ProviderDepositStatus(
            providerId: $providerId,
            status: $this->statusMapper->mapDepositStatus(
                $response['response']['status']
            ),
            bankTxId: $response['response']['bankTxId'] ?? null,
            payerName: $response['response']['payerName'] ?? null,
            payerTaxNumber: $response['response']['payerTaxNumber'] ?? null,
            valueInCents: $response['response']['valueInCents'] ?? null,
            rawResponse: $response
        );
    }
}
```

### 8.5 HTTP Client com Resiliência

```php
<?php

namespace App\Infrastructure\Integration\PaymentProvider\Eulen;

class EulenHttpClient
{
    private CircuitBreaker $circuitBreaker;
    private RetryPolicy $retryPolicy;

    public function __construct(
        private readonly HttpClientInterface $http,
        private readonly EulenAuthenticator $auth,
        private readonly EulenConfig $config,
        private readonly LoggerInterface $logger,
        CircuitBreakerFactory $cbFactory
    ) {
        $this->circuitBreaker = $cbFactory->create(
            name: 'eulen',
            failureThreshold: $config->circuitBreakerThreshold,
            recoveryTime: $config->circuitBreakerRecoveryTime
        );

        $this->retryPolicy = new RetryPolicy(
            maxAttempts: $config->retryAttempts,
            baseDelayMs: 100,
            maxDelayMs: 5000,
            multiplier: 2.0
        );
    }

    public function post(
        string $endpoint,
        array $data,
        array $headers = []
    ): array {
        return $this->executeWithResilience(
            fn() => $this->doPost($endpoint, $data, $headers)
        );
    }

    public function get(
        string $endpoint,
        array $query = [],
        array $headers = []
    ): array {
        return $this->executeWithResilience(
            fn() => $this->doGet($endpoint, $query, $headers)
        );
    }

    private function executeWithResilience(callable $operation): array
    {
        // Verifica Circuit Breaker
        if ($this->circuitBreaker->isOpen()) {
            throw new CircuitBreakerOpenException(
                'Eulen API circuit breaker is open'
            );
        }

        try {
            $result = $this->retryPolicy->execute($operation);
            $this->circuitBreaker->recordSuccess();
            return $result;

        } catch (Throwable $e) {
            $this->circuitBreaker->recordFailure();
            throw $e;
        }
    }

    private function doPost(
        string $endpoint,
        array $data,
        array $headers
    ): array {
        $url = $this->config->baseUrl . $endpoint;

        $requestId = Str::uuid()->toString();

        $this->logger->info('Eulen API request', [
            'request_id' => $requestId,
            'method' => 'POST',
            'endpoint' => $endpoint,
            'data' => $this->sanitizeForLog($data)
        ]);

        $response = $this->http->request('POST', $url, [
            'headers' => array_merge([
                'Authorization' => 'Bearer ' . $this->auth->getToken(),
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'X-Request-ID' => $requestId,
            ], $headers),
            'json' => $data,
            'timeout' => $this->config->timeout,
        ]);

        $statusCode = $response->getStatusCode();
        $body = json_decode($response->getBody()->getContents(), true);

        $this->logger->info('Eulen API response', [
            'request_id' => $requestId,
            'status_code' => $statusCode,
            'async' => $body['async'] ?? false
        ]);

        if ($statusCode >= 400) {
            throw new EulenApiException(
                message: $body['response']['errorMessage'] ?? 'Unknown error',
                statusCode: $statusCode,
                response: $body
            );
        }

        // Handle async response (202)
        if ($statusCode === 202) {
            return $this->pollAsyncResponse($body, $requestId);
        }

        return $body;
    }

    private function pollAsyncResponse(array $asyncResponse, string $requestId): array
    {
        $urlResponse = $asyncResponse['urlResponse'];
        $expiration = new DateTimeImmutable($asyncResponse['expiration']);
        $maxAttempts = 10;
        $attempt = 0;

        while ($attempt < $maxAttempts && new DateTimeImmutable() < $expiration) {
            sleep(2); // Aguarda 2 segundos entre tentativas
            $attempt++;

            try {
                $response = $this->http->request('GET', $urlResponse, [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $this->auth->getToken(),
                    ]
                ]);

                $body = json_decode($response->getBody()->getContents(), true);

                if (!($body['async'] ?? false)) {
                    return $body; // Resposta final
                }

            } catch (Throwable $e) {
                $this->logger->warning('Async poll failed', [
                    'request_id' => $requestId,
                    'attempt' => $attempt,
                    'error' => $e->getMessage()
                ]);
            }
        }

        throw new EulenApiException(
            'Async response timeout',
            statusCode: 504
        );
    }

    private function sanitizeForLog(array $data): array
    {
        // Remove dados sensíveis para logs
        $sensitive = ['password', 'token', 'secret', 'taxNumber'];
        foreach ($sensitive as $key) {
            if (isset($data[$key])) {
                $data[$key] = '***REDACTED***';
            }
        }
        return $data;
    }
}
```

### 8.6 Status Mapper

```php
<?php

namespace App\Infrastructure\Integration\PaymentProvider\Eulen;

class EulenStatusMapper
{
    /**
     * Mapeia status do Eulen para status interno (depósito)
     */
    public function mapDepositStatus(string $eulenStatus): ProviderStatus
    {
        return match ($eulenStatus) {
            'pending' => ProviderStatus::PENDING,
            'under_review' => ProviderStatus::PROCESSING,
            'approved' => ProviderStatus::PROCESSING,
            'depix_sent' => ProviderStatus::CONFIRMED,
            'delayed' => ProviderStatus::PROCESSING,
            'refunded' => ProviderStatus::REFUNDED,
            'canceled' => ProviderStatus::CANCELLED,
            'expired' => ProviderStatus::EXPIRED,
            'error' => ProviderStatus::FAILED,
            default => throw new UnknownStatusException($eulenStatus)
        };
    }

    /**
     * Mapeia status do Eulen para status interno (saque)
     */
    public function mapWithdrawalStatus(string $eulenStatus): ProviderStatus
    {
        return match ($eulenStatus) {
            'unsent' => ProviderStatus::PENDING,
            'sending' => ProviderStatus::PROCESSING,
            'sent' => ProviderStatus::CONFIRMED,
            'refunded' => ProviderStatus::REFUNDED,
            'cancelled' => ProviderStatus::CANCELLED,
            'error' => ProviderStatus::FAILED,
            'expired' => ProviderStatus::EXPIRED,
            default => throw new UnknownStatusException($eulenStatus)
        };
    }

    /**
     * Verifica se é status terminal
     */
    public function isTerminal(ProviderStatus $status): bool
    {
        return in_array($status, [
            ProviderStatus::CONFIRMED,
            ProviderStatus::FAILED,
            ProviderStatus::EXPIRED,
            ProviderStatus::REFUNDED,
            ProviderStatus::CANCELLED,
        ]);
    }
}
```

### 8.7 Webhook Handler

```php
<?php

namespace App\Infrastructure\Integration\PaymentProvider\Eulen;

class EulenWebhookHandler implements WebhookHandlerInterface
{
    public function __construct(
        private readonly EulenStatusMapper $statusMapper,
        private readonly DepositRepository $depositRepository,
        private readonly WithdrawalRepository $withdrawalRepository,
        private readonly EventDispatcher $eventDispatcher,
        private readonly LoggerInterface $logger
    ) {}

    public function validateSignature(
        string $payload,
        string $signature,
        array $headers
    ): bool {
        // TODO: Implementar validação de assinatura
        // A documentação da Eulen não especifica o método de assinatura
        // Este é um PONTO DE VALIDAÇÃO ADICIONAL
        return true;
    }

    public function processWebhook(
        string $eventType,
        array $payload
    ): WebhookResult {

        $this->logger->info('Processing Eulen webhook', [
            'event_type' => $eventType,
            'payload' => $payload
        ]);

        return match ($eventType) {
            'deposit.status_changed' => $this->handleDepositStatus($payload),
            'withdrawal.status_changed' => $this->handleWithdrawalStatus($payload),
            default => new WebhookResult(
                processed: false,
                message: "Unknown event type: {$eventType}"
            )
        };
    }

    private function handleDepositStatus(array $payload): WebhookResult
    {
        $providerId = $payload['qrId'] ?? $payload['id'];
        $eulenStatus = $payload['status'];

        $deposit = $this->depositRepository->findByProviderId($providerId);

        if (!$deposit) {
            return new WebhookResult(
                processed: false,
                message: "Deposit not found: {$providerId}"
            );
        }

        $providerStatus = $this->statusMapper->mapDepositStatus($eulenStatus);

        $this->eventDispatcher->dispatch(
            new ProviderDepositStatusChanged(
                depositId: $deposit->id,
                providerId: $providerId,
                previousStatus: $deposit->providerStatus,
                newStatus: $providerStatus,
                payload: $payload
            )
        );

        return new WebhookResult(
            processed: true,
            message: "Deposit status updated to {$providerStatus->value}"
        );
    }

    private function handleWithdrawalStatus(array $payload): WebhookResult
    {
        $providerId = $payload['withdrawalId'] ?? $payload['id'];
        $eulenStatus = $payload['status'];

        $withdrawal = $this->withdrawalRepository->findByProviderId($providerId);

        if (!$withdrawal) {
            return new WebhookResult(
                processed: false,
                message: "Withdrawal not found: {$providerId}"
            );
        }

        $providerStatus = $this->statusMapper->mapWithdrawalStatus($eulenStatus);

        $this->eventDispatcher->dispatch(
            new ProviderWithdrawalStatusChanged(
                withdrawalId: $withdrawal->id,
                providerId: $providerId,
                previousStatus: $withdrawal->providerStatus,
                newStatus: $providerStatus,
                payload: $payload
            )
        );

        return new WebhookResult(
            processed: true,
            message: "Withdrawal status updated to {$providerStatus->value}"
        );
    }

    public function getSupportedEvents(): array
    {
        return [
            'deposit.status_changed',
            'withdrawal.status_changed',
        ];
    }
}
```

### 8.8 Provider Factory

```php
<?php

namespace App\Infrastructure\Integration\PaymentProvider\Factory;

class PaymentProviderFactory
{
    public function __construct(
        private readonly Container $container,
        private readonly ProviderConfigRepository $configRepository
    ) {}

    public function createDepositProvider(?string $name = null): DepositProviderInterface
    {
        $config = $name
            ? $this->configRepository->findByName($name)
            : $this->configRepository->getDefaultForDeposit();

        return $this->instantiate($config);
    }

    public function createWithdrawalProvider(?string $name = null): WithdrawalProviderInterface
    {
        $config = $name
            ? $this->configRepository->findByName($name)
            : $this->configRepository->getDefaultForWithdrawal();

        return $this->instantiate($config);
    }

    private function instantiate(ProviderConfiguration $config): PaymentProviderInterface
    {
        return match ($config->providerName) {
            'eulen' => $this->container->make(EulenProvider::class, [
                'config' => EulenConfig::fromConfiguration($config)
            ]),
            'mock' => $this->container->make(MockProvider::class),
            default => throw new UnknownProviderException($config->providerName)
        };
    }
}
```

### 8.9 Pontos de Validação da Documentação Eulen

| # | Ponto | Status | Ação Requerida |
|---|-------|--------|----------------|
| 1 | Validação de assinatura de webhook | INDEFINIDO | Confirmar com Eulen o método de assinatura (HMAC-SHA256?) |
| 2 | Eventos de webhook disponíveis | PARCIAL | Documentação menciona webhooks mas não lista eventos |
| 3 | Endpoint de configuração de webhook | INDEFINIDO | Como configurar URL de callback? |
| 4 | Rate limits específicos | INDEFINIDO | Documentação não especifica limites |
| 5 | Sandbox/Testing environment | PARCIAL | Mencionado `sk_test_*` mas sem detalhes |
| 6 | Estrutura completa do webhook | INDEFINIDO | Campos exatos do payload |
| 7 | Retry policy de webhooks | INDEFINIDO | Quantas vezes tenta reenviar? |
| 8 | Endpoint de User Info | MENCIONADO | Verificar limites por EUID |
| 9 | MED Webhook | MENCIONADO | O que é MED? Quando é disparado? |
| 10 | Fee handling em withdraw | DOCUMENTADO | Fee deve ser pago como output separado |
