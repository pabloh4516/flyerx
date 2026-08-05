<?php

declare(strict_types=1);

namespace App\Application\Lwk\Services;

use App\Application\Lwk\Contracts\LwkServiceInterface;
use App\Application\Lwk\DTOs\FeeEstimateDTO;
use App\Application\Lwk\DTOs\WithdrawalDTO;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Implementação do serviço de comunicação com o microserviço LWK.
 */
class LwkService implements LwkServiceInterface
{
    private string $baseUrl;
    private string $apiKey;
    private int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.lwk.url', 'http://localhost:8000');
        $this->apiKey = config('services.lwk.api_key', '');
        $this->timeout = config('services.lwk.timeout', 30);
    }

    /**
     * Retorna cliente HTTP configurado.
     */
    private function client(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->timeout($this->timeout)
            ->withHeaders([
                'X-API-Key' => $this->apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ]);
    }

    /**
     * {@inheritdoc}
     */
    public function createWithdrawal(
        string $userId,
        string $pixKey,
        string $pixKeyType,
        string $beneficiaryTaxNumber,
        int $amountCents,
    ): WithdrawalDTO {
        Log::info('LWK: Criando saque', [
            'user_id' => $userId,
            'amount_cents' => $amountCents,
        ]);

        $response = $this->client()->post('/internal/withdrawals', [
            'user_id' => $userId,
            'pix_key' => $pixKey,
            'pix_key_type' => $pixKeyType,
            'beneficiary_tax_number' => $beneficiaryTaxNumber,
            'amount_cents' => $amountCents,
        ]);

        if ($response->failed()) {
            Log::error('LWK: Erro ao criar saque', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new LwkServiceException(
                'Erro ao criar saque: ' . ($response->json('detail') ?? $response->body()),
                $response->status()
            );
        }

        return WithdrawalDTO::fromArray($response->json());
    }

    /**
     * {@inheritdoc}
     */
    public function getWithdrawal(string $withdrawalId, string $userId): WithdrawalDTO
    {
        $response = $this->client()->get("/internal/withdrawals/{$withdrawalId}", [
            'user_id' => $userId,
        ]);

        if ($response->failed()) {
            throw new LwkServiceException(
                'Erro ao consultar saque: ' . ($response->json('detail') ?? $response->body()),
                $response->status()
            );
        }

        return WithdrawalDTO::fromArray($response->json());
    }

    /**
     * {@inheritdoc}
     */
    public function getWithdrawalStatus(string $withdrawalId, string $userId): WithdrawalDTO
    {
        $response = $this->client()->get("/internal/withdrawals/{$withdrawalId}/status", [
            'user_id' => $userId,
        ]);

        if ($response->failed()) {
            throw new LwkServiceException(
                'Erro ao consultar status: ' . ($response->json('detail') ?? $response->body()),
                $response->status()
            );
        }

        return WithdrawalDTO::fromArray($response->json());
    }

    /**
     * {@inheritdoc}
     */
    public function listWithdrawals(
        string $userId,
        ?string $status = null,
        int $limit = 20,
        int $offset = 0,
    ): array {
        $query = [
            'user_id' => $userId,
            'limit' => $limit,
            'offset' => $offset,
        ];

        if ($status !== null) {
            $query['status'] = $status;
        }

        $response = $this->client()->get('/internal/withdrawals', $query);

        if ($response->failed()) {
            throw new LwkServiceException(
                'Erro ao listar saques: ' . ($response->json('detail') ?? $response->body()),
                $response->status()
            );
        }

        $data = $response->json();

        return [
            'items' => array_map(
                fn(array $item) => WithdrawalDTO::fromArray($item),
                $data['items']
            ),
            'total' => $data['total'],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function cancelWithdrawal(string $withdrawalId, string $userId): bool
    {
        $response = $this->client()->post("/internal/withdrawals/{$withdrawalId}/cancel", [
            'user_id' => $userId,
        ]);

        if ($response->failed()) {
            if ($response->status() === 400) {
                return false;
            }
            throw new LwkServiceException(
                'Erro ao cancelar saque: ' . ($response->json('detail') ?? $response->body()),
                $response->status()
            );
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function estimateFee(float $amountReais): FeeEstimateDTO
    {
        // Endpoint público, não requer autenticação
        $response = Http::baseUrl($this->baseUrl)
            ->timeout($this->timeout)
            ->post('/internal/withdrawals/estimate-fee', [
                'amount_reais' => $amountReais,
            ]);

        if ($response->failed()) {
            throw new LwkServiceException(
                'Erro ao estimar taxas: ' . ($response->json('detail') ?? $response->body()),
                $response->status()
            );
        }

        return FeeEstimateDTO::fromArray($response->json());
    }

    /**
     * {@inheritdoc}
     */
    public function isHealthy(): bool
    {
        try {
            $response = Http::baseUrl($this->baseUrl)
                ->timeout(5)
                ->get('/health');

            return $response->ok() && $response->json('status') === 'healthy';
        } catch (\Exception $e) {
            Log::warning('LWK: Health check falhou', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
