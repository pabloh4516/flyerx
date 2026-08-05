<?php

declare(strict_types=1);

namespace App\Application\Lwk\Contracts;

use App\Application\Lwk\DTOs\FeeEstimateDTO;
use App\Application\Lwk\DTOs\WithdrawalDTO;

/**
 * Interface para o serviço de comunicação com o microserviço LWK.
 */
interface LwkServiceInterface
{
    /**
     * Cria uma nova solicitação de saque.
     *
     * @param string $userId ID do usuário
     * @param string $pixKey Chave PIX do destinatário
     * @param string $pixKeyType Tipo da chave (CPF, CNPJ, EMAIL, PHONE, RANDOM)
     * @param string $beneficiaryTaxNumber CPF/CNPJ do titular da chave
     * @param int $amountCents Valor em centavos
     * @return WithdrawalDTO
     */
    public function createWithdrawal(
        string $userId,
        string $pixKey,
        string $pixKeyType,
        string $beneficiaryTaxNumber,
        int $amountCents,
    ): WithdrawalDTO;

    /**
     * Consulta um saque pelo ID.
     *
     * @param string $withdrawalId ID do saque
     * @param string $userId ID do usuário (para validação)
     * @return WithdrawalDTO
     */
    public function getWithdrawal(string $withdrawalId, string $userId): WithdrawalDTO;

    /**
     * Consulta status de um saque.
     *
     * @param string $withdrawalId ID do saque
     * @param string $userId ID do usuário (para validação)
     * @return WithdrawalDTO
     */
    public function getWithdrawalStatus(string $withdrawalId, string $userId): WithdrawalDTO;

    /**
     * Lista saques de um usuário.
     *
     * @param string $userId ID do usuário
     * @param string|null $status Filtrar por status
     * @param int $limit Limite de resultados
     * @param int $offset Offset para paginação
     * @return array{items: WithdrawalDTO[], total: int}
     */
    public function listWithdrawals(
        string $userId,
        ?string $status = null,
        int $limit = 20,
        int $offset = 0,
    ): array;

    /**
     * Cancela um saque pendente.
     *
     * @param string $withdrawalId ID do saque
     * @param string $userId ID do usuário
     * @return bool
     */
    public function cancelWithdrawal(string $withdrawalId, string $userId): bool;

    /**
     * Estima taxas para um saque.
     *
     * @param float $amountReais Valor em reais
     * @return FeeEstimateDTO
     */
    public function estimateFee(float $amountReais): FeeEstimateDTO;

    /**
     * Verifica se o microserviço está saudável.
     *
     * @return bool
     */
    public function isHealthy(): bool;
}
