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

class EulenProvider implements PaymentProviderInterface
{
    private PendingRequest $client;
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('eulen.base_url'), '/');

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

    public function createDeposit(CreateDepositRequest $request): CreateDepositResponse
    {
        try {
            $response = $this->client
                ->withHeader('X-Nonce', $request->idempotencyKey)
                ->post("{$this->baseUrl}/deposit", [
                    'amount' => $request->amount,
                    'currency' => $request->currency,
                    'description' => $request->description ?? 'Depósito PIX',
                    'expiration_minutes' => $request->expirationMinutes ?? config('eulen.deposit_expiration_minutes', 30),
                    'metadata' => $request->metadata,
                ]);

            $data = $response->json();

            $this->logRequest('createDeposit', $request, $response->status(), $data);

            if ($response->failed()) {
                return CreateDepositResponse::failure(
                    errorCode: $data['error_code'] ?? 'PROVIDER_ERROR',
                    errorMessage: $data['message'] ?? 'Provider request failed',
                    rawResponse: $data,
                );
            }

            // Map Eulen response to our format
            $expiresAt = isset($data['expires_at'])
                ? new DateTimeImmutable($data['expires_at'])
                : (new DateTimeImmutable())->modify('+30 minutes');

            return CreateDepositResponse::success(
                providerId: $data['id'] ?? $data['deposit_id'],
                status: $this->mapDepositStatus($data['status'] ?? 'pending'),
                pixQrCode: $data['qr_code'] ?? $data['pix_qr_code'],
                pixCopyPaste: $data['copy_paste'] ?? $data['pix_copy_paste'] ?? $data['qr_code_text'],
                pixTxId: $data['txid'] ?? $data['pix_txid'] ?? $data['id'],
                expiresAt: $expiresAt,
                rawResponse: $data,
            );
        } catch (\Throwable $e) {
            $this->logError('createDeposit', $request, $e);

            return CreateDepositResponse::failure(
                errorCode: 'CONNECTION_ERROR',
                errorMessage: $e->getMessage(),
            );
        }
    }

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
                    errorMessage: $data['message'] ?? 'Provider request failed',
                    rawResponse: $data,
                );
            }

            $paidAt = isset($data['paid_at']) ? new DateTimeImmutable($data['paid_at']) : null;

            return DepositStatusResponse::success(
                providerId: $providerId,
                status: $this->mapDepositStatus($data['status']),
                amount: (float) ($data['amount'] ?? 0),
                paidAmount: isset($data['paid_amount']) ? (float) $data['paid_amount'] : null,
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

    public function createWithdrawal(CreateWithdrawalRequest $request): CreateWithdrawalResponse
    {
        try {
            $response = $this->client
                ->withHeader('X-Nonce', $request->idempotencyKey)
                ->post("{$this->baseUrl}/withdraw", [
                    'amount' => $request->amount,
                    'pix_key_type' => $request->pixKeyType,
                    'pix_key' => $request->pixKey,
                    'recipient_name' => $request->recipientName,
                    'recipient_document' => $request->recipientDocument,
                    'description' => $request->description ?? 'Saque PIX',
                    'metadata' => $request->metadata,
                ]);

            $data = $response->json();

            $this->logRequest('createWithdrawal', $request, $response->status(), $data);

            if ($response->failed()) {
                return CreateWithdrawalResponse::failure(
                    errorCode: $data['error_code'] ?? 'PROVIDER_ERROR',
                    errorMessage: $data['message'] ?? 'Provider request failed',
                    rawResponse: $data,
                );
            }

            return CreateWithdrawalResponse::success(
                providerId: $data['id'] ?? $data['withdrawal_id'],
                status: $this->mapWithdrawalStatus($data['status'] ?? 'pending'),
                endToEndId: $data['end_to_end_id'] ?? $data['e2e_id'] ?? null,
                recipientName: $data['recipient_name'] ?? $request->recipientName,
                recipientDocument: $data['recipient_document'] ?? $request->recipientDocument,
                rawResponse: $data,
            );
        } catch (\Throwable $e) {
            $this->logError('createWithdrawal', $request, $e);

            return CreateWithdrawalResponse::failure(
                errorCode: 'CONNECTION_ERROR',
                errorMessage: $e->getMessage(),
            );
        }
    }

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
                    errorMessage: $data['message'] ?? 'Provider request failed',
                    rawResponse: $data,
                );
            }

            $completedAt = isset($data['completed_at']) ? new DateTimeImmutable($data['completed_at']) : null;

            return WithdrawalStatusResponse::success(
                providerId: $providerId,
                status: $this->mapWithdrawalStatus($data['status']),
                amount: (float) ($data['amount'] ?? 0),
                endToEndId: $data['end_to_end_id'] ?? $data['e2e_id'] ?? null,
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

    public function healthCheck(): bool
    {
        try {
            $response = $this->client->get("{$this->baseUrl}/health");

            return $response->successful();
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Map Eulen deposit status to internal status.
     */
    private function mapDepositStatus(string $eulenStatus): string
    {
        // Based on Eulen documentation research
        return match (strtolower($eulenStatus)) {
            'pending', 'waiting', 'awaiting' => 'awaiting_payment',
            'processing', 'in_progress' => 'processing',
            'paid', 'completed', 'confirmed', 'success' => 'completed',
            'expired', 'timeout' => 'expired',
            'failed', 'error', 'cancelled' => 'failed',
            default => 'pending',
        };
    }

    /**
     * Map Eulen withdrawal status to internal status.
     */
    private function mapWithdrawalStatus(string $eulenStatus): string
    {
        return match (strtolower($eulenStatus)) {
            'pending', 'waiting' => 'pending',
            'approved' => 'approved',
            'processing', 'in_progress' => 'processing',
            'completed', 'paid', 'confirmed', 'success' => 'completed',
            'failed', 'error' => 'failed',
            'cancelled', 'rejected' => 'cancelled',
            default => 'pending',
        };
    }

    private function logRequest(string $method, mixed $request, int $statusCode, array $response): void
    {
        Log::channel('eulen')->info("Eulen API: {$method}", [
            'request' => $request instanceof CreateDepositRequest || $request instanceof CreateWithdrawalRequest
                ? (array) $request
                : $request,
            'status_code' => $statusCode,
            'response' => $this->sanitizeResponse($response),
        ]);
    }

    private function logError(string $method, mixed $request, \Throwable $e): void
    {
        Log::channel('eulen')->error("Eulen API Error: {$method}", [
            'request' => $request instanceof CreateDepositRequest || $request instanceof CreateWithdrawalRequest
                ? (array) $request
                : $request,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
    }

    private function sanitizeResponse(array $response): array
    {
        // Remove sensitive data from logs
        $sensitive = ['token', 'api_key', 'secret'];

        foreach ($sensitive as $key) {
            if (isset($response[$key])) {
                $response[$key] = '[REDACTED]';
            }
        }

        return $response;
    }
}
