<?php

declare(strict_types=1);

namespace App\Application\Lwk\DTOs;

use DateTimeImmutable;

/**
 * DTO para resposta de saque do microserviço LWK.
 */
final class WithdrawalDTO
{
    public function __construct(
        public readonly string $id,
        public readonly string $status,
        public readonly string $flyerxAddress,
        public readonly string $pixKey,
        public readonly string $pixKeyType,
        public readonly string $beneficiaryTaxNumber,
        public readonly float $requestedAmount,
        public readonly float $partnerFee,
        public readonly float $eulenFee,
        public readonly float $totalFee,
        public readonly float $totalDepix,
        public readonly ?string $userTxId,
        public readonly ?string $eulenWithdrawalId,
        public readonly ?string $receiptUrl,
        public readonly DateTimeImmutable $createdAt,
        public readonly ?DateTimeImmutable $expiresAt,
        public readonly ?DateTimeImmutable $completedAt,
    ) {}

    /**
     * Cria DTO a partir da resposta JSON do microserviço.
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            status: $data['status'],
            flyerxAddress: $data['flyerx_address'],
            pixKey: $data['pix_key'],
            pixKeyType: $data['pix_key_type'],
            beneficiaryTaxNumber: $data['beneficiary_tax_number'],
            requestedAmount: $data['breakdown']['requested_amount'],
            partnerFee: $data['breakdown']['partner_fee'],
            eulenFee: $data['breakdown']['eulen_fee'],
            totalFee: $data['breakdown']['total_fee'],
            totalDepix: $data['breakdown']['total_depix'],
            userTxId: $data['user_tx_id'] ?? null,
            eulenWithdrawalId: $data['eulen_withdrawal_id'] ?? null,
            receiptUrl: $data['receipt_url'] ?? null,
            createdAt: new DateTimeImmutable($data['created_at']),
            expiresAt: isset($data['expires_at']) ? new DateTimeImmutable($data['expires_at']) : null,
            completedAt: isset($data['completed_at']) ? new DateTimeImmutable($data['completed_at']) : null,
        );
    }
}
