<?php

declare(strict_types=1);

namespace App\Infrastructure\Payment\Providers;

use App\Domain\Payment\Contracts\PaymentProviderInterface;
use App\Domain\Payment\DTOs\CreateDepositRequest;
use App\Domain\Payment\DTOs\CreateDepositResponse;
use App\Domain\Payment\DTOs\CreateWithdrawalRequest;
use App\Domain\Payment\DTOs\CreateWithdrawalResponse;
use App\Domain\Payment\DTOs\DepositStatusResponse;
use App\Domain\Payment\DTOs\WithdrawalStatusResponse;
use DateTimeImmutable;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Integração com Eulen Pix2Depix API
 *
 * @see https://docs.eulen.app/-api-overview-782111m0.md
 */
class EulenProvider implements PaymentProviderInterface
{
    private PendingRequest $client;
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('eulen.base_url', 'https://depix.eulen.app/api'), '/');

        $this->client = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('eulen.api_token'),
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ])
        ->timeout(config('eulen.timeout', 30))
        ->retry(config('eulen.retry_attempts', 3), config('eulen.retry_delay', 100));
    }

    public function getName(): string
    {
        return 'eulen';
    }

    /**
     * Cria um depósito PIX → DePix
     *
     * @see https://docs.eulen.app/deposit-pix-depix-12532107e0.md
     */
    public function createDeposit(CreateDepositRequest $request): CreateDepositResponse
    {
        try {
            // Validar request antes de enviar
            $errors = $request->validate();
            if (!empty($errors)) {
                return CreateDepositResponse::failure(
                    errorCode: 'VALIDATION_ERROR',
                    errorMessage: implode(', ', $errors),
                );
            }

            $headers = [];
            if ($request->idempotencyKey !== null) {
                $headers['X-Nonce'] = $request->idempotencyKey;
            }

            $response = $this->client
                ->withHeaders($headers)
                ->post("{$this->baseUrl}/deposit", $request->toEulenPayload());

            $data = $response->json();

            $this->logRequest('createDeposit', $request->toEulenPayload(), $response->status(), $data);

            if ($response->failed()) {
                $errorMessage = $data['response']['errorMessage']
                    ?? $data['errorMessage']
                    ?? $data['message']
                    ?? 'Erro ao criar depósito';

                return CreateDepositResponse::failure(
                    errorCode: $data['error_code'] ?? 'PROVIDER_ERROR',
                    errorMessage: $errorMessage,
                    rawResponse: $data,
                );
            }

            // Eulen retorna: { response: { id, qrCopyPaste, qrImageUrl }, async: false }
            $depositData = $data['response'] ?? $data;

            // Depósitos Eulen expiram em 24 horas por padrão
            $expiresAt = (new DateTimeImmutable())->modify('+24 hours');

            return CreateDepositResponse::success(
                providerId: $depositData['id'],
                status: 'awaiting_payment',
                pixQrCode: $depositData['qrImageUrl'] ?? null,
                pixCopyPaste: $depositData['qrCopyPaste'],
                pixTxId: $depositData['id'],
                expiresAt: $expiresAt,
                rawResponse: $data,
            );
        } catch (\Throwable $e) {
            $this->logError('createDeposit', $request->toEulenPayload(), $e);

            return CreateDepositResponse::failure(
                errorCode: 'CONNECTION_ERROR',
                errorMessage: $e->getMessage(),
            );
        }
    }

    /**
     * Consulta status de um depósito
     *
     * @see https://docs.eulen.app/deposit-status-12667971e0.md
     */
    public function getDepositStatus(string $providerId): DepositStatusResponse
    {
        try {
            $response = $this->client->get("{$this->baseUrl}/deposit-status", [
                'id' => $providerId,
            ]);

            $data = $response->json();

            $this->logRequest('getDepositStatus', ['id' => $providerId], $response->status(), $data);

            if ($response->failed()) {
                return DepositStatusResponse::failure(
                    errorCode: $data['error_code'] ?? 'PROVIDER_ERROR',
                    errorMessage: $data['message'] ?? 'Erro ao consultar status',
                    rawResponse: $data,
                );
            }

            $statusData = $data['response'] ?? $data;
            $paidAt = isset($statusData['paidAt']) ? new DateTimeImmutable($statusData['paidAt']) : null;

            return DepositStatusResponse::success(
                providerId: $providerId,
                status: $this->mapDepositStatus($statusData['status'] ?? 'pending'),
                amount: (float) ($statusData['valueInCents'] ?? 0) / 100,
                paidAmount: isset($statusData['paidValueInCents']) ? (float) $statusData['paidValueInCents'] / 100 : null,
                paidAt: $paidAt,
                rawResponse: $data,
            );
        } catch (\Throwable $e) {
            $this->logError('getDepositStatus', ['id' => $providerId], $e);

            return DepositStatusResponse::failure(
                errorCode: 'CONNECTION_ERROR',
                errorMessage: $e->getMessage(),
            );
        }
    }

    /**
     * Cria um saque DePix → PIX
     *
     * @see https://docs.eulen.app/withdraw-25979382e0.md
     */
    public function createWithdrawal(CreateWithdrawalRequest $request): CreateWithdrawalResponse
    {
        try {
            // Validar request
            $errors = $request->validate();
            if (!empty($errors)) {
                return CreateWithdrawalResponse::failure(
                    errorCode: 'VALIDATION_ERROR',
                    errorMessage: implode(', ', $errors),
                );
            }

            $headers = [];
            if ($request->idempotencyKey !== null) {
                $headers['X-Nonce'] = $request->idempotencyKey;
            }

            $response = $this->client
                ->withHeaders($headers)
                ->post("{$this->baseUrl}/withdraw", $request->toEulenPayload());

            $data = $response->json();

            $this->logRequest('createWithdrawal', $request->toEulenPayload(), $response->status(), $data);

            if ($response->failed()) {
                $errorMessage = $data['response']['errorMessage']
                    ?? $data['errorMessage']
                    ?? $data['message']
                    ?? 'Erro ao criar saque';

                return CreateWithdrawalResponse::failure(
                    errorCode: $data['error_code'] ?? 'PROVIDER_ERROR',
                    errorMessage: $errorMessage,
                    rawResponse: $data,
                );
            }

            // Eulen retorna: { response: { withdrawalId, depositAddress, depositAmountInCents, payoutAmountInCents }, async: false }
            $withdrawData = $data['response'] ?? $data;

            return CreateWithdrawalResponse::success(
                providerId: $withdrawData['withdrawalId'],
                status: 'pending',
                depositAddress: $withdrawData['depositAddress'],
                depositAmountInCents: $withdrawData['depositAmountInCents'],
                payoutAmountInCents: $withdrawData['payoutAmountInCents'],
                rawResponse: $data,
            );
        } catch (\Throwable $e) {
            $this->logError('createWithdrawal', $request->toEulenPayload(), $e);

            return CreateWithdrawalResponse::failure(
                errorCode: 'CONNECTION_ERROR',
                errorMessage: $e->getMessage(),
            );
        }
    }

    /**
     * Consulta status de um saque
     *
     * @see https://docs.eulen.app/withdraw-status-25979384e0.md
     */
    public function getWithdrawalStatus(string $providerId): WithdrawalStatusResponse
    {
        try {
            $response = $this->client->get("{$this->baseUrl}/withdraw-status", [
                'id' => $providerId,
            ]);

            $data = $response->json();

            $this->logRequest('getWithdrawalStatus', ['id' => $providerId], $response->status(), $data);

            if ($response->failed()) {
                return WithdrawalStatusResponse::failure(
                    errorCode: $data['error_code'] ?? 'PROVIDER_ERROR',
                    errorMessage: $data['message'] ?? 'Erro ao consultar status',
                    rawResponse: $data,
                );
            }

            $statusData = $data['response'] ?? $data;
            $completedAt = isset($statusData['completedAt']) ? new DateTimeImmutable($statusData['completedAt']) : null;

            return WithdrawalStatusResponse::success(
                providerId: $providerId,
                status: $this->mapWithdrawalStatus($statusData['status'] ?? 'pending'),
                amount: (float) ($statusData['payoutAmountInCents'] ?? 0) / 100,
                endToEndId: $statusData['endToEndId'] ?? $statusData['e2eId'] ?? null,
                completedAt: $completedAt,
                rawResponse: $data,
            );
        } catch (\Throwable $e) {
            $this->logError('getWithdrawalStatus', ['id' => $providerId], $e);

            return WithdrawalStatusResponse::failure(
                errorCode: 'CONNECTION_ERROR',
                errorMessage: $e->getMessage(),
            );
        }
    }

    /**
     * Consulta informações do usuário e limites
     *
     * @see https://docs.eulen.app/user-info-21725604e0.md
     */
    public function getUserInfo(string $euid): array
    {
        try {
            $response = $this->client->get("{$this->baseUrl}/user-info", [
                'euid' => $euid,
            ]);

            $data = $response->json();

            $this->logRequest('getUserInfo', ['euid' => $euid], $response->status(), $data);

            if ($response->failed()) {
                return [
                    'success' => false,
                    'error' => $data['message'] ?? 'Erro ao consultar usuário',
                ];
            }

            return [
                'success' => true,
                'data' => $data['response'] ?? $data,
            ];
        } catch (\Throwable $e) {
            $this->logError('getUserInfo', ['euid' => $euid], $e);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function healthCheck(): bool
    {
        try {
            $response = $this->client->get("{$this->baseUrl}/ping");

            return $response->successful();
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Mapeia status de depósito da Eulen para status interno
     *
     * @see https://docs.eulen.app/-deposit-statuses-1443187m0.md
     */
    private function mapDepositStatus(string $eulenStatus): string
    {
        return match (strtolower($eulenStatus)) {
            'pending' => 'awaiting_payment',
            'delayed' => 'awaiting_payment',
            'under_review' => 'processing',
            'approved' => 'processing',
            'depix_sent' => 'completed',
            'expired' => 'expired',
            'canceled' => 'failed',
            'refunded' => 'refunded',
            'error' => 'failed',
            default => 'pending',
        };
    }

    /**
     * Mapeia status de saque da Eulen para status interno.
     *
     * Status Eulen (oficiais):
     * - unsent: Aguardando DePix do usuário
     * - sending: Processando envio do PIX
     * - sent: PIX enviado com sucesso
     * - error: Erro no processamento
     * - canceled: Cancelado
     * - refunded: Reembolsado
     *
     * @see https://docs.eulen.app/-withdraw-statuses-1966899m0.md
     */
    private function mapWithdrawalStatus(string $eulenStatus): string
    {
        return match (strtolower($eulenStatus)) {
            'unsent' => 'pending',
            'sending' => 'processing',
            'sent' => 'completed',
            'error' => 'failed',
            'canceled' => 'failed',
            'refunded' => 'refunded',
            default => 'pending',
        };
    }

    private function logRequest(string $method, mixed $request, int $statusCode, array $response): void
    {
        Log::channel('eulen')->info("Eulen API: {$method}", [
            'request' => is_array($request) ? $request : (array) $request,
            'status_code' => $statusCode,
            'response' => $this->sanitizeResponse($response),
        ]);
    }

    private function logError(string $method, mixed $request, \Throwable $e): void
    {
        Log::channel('eulen')->error("Eulen API Error: {$method}", [
            'request' => is_array($request) ? $request : (array) $request,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
    }

    private function sanitizeResponse(array $response): array
    {
        $sensitive = ['token', 'api_key', 'secret', 'authorization'];

        foreach ($sensitive as $key) {
            if (isset($response[$key])) {
                $response[$key] = '[REDACTED]';
            }
        }

        return $response;
    }
}
