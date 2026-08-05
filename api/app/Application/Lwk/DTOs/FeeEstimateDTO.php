<?php

declare(strict_types=1);

namespace App\Application\Lwk\DTOs;

/**
 * DTO para estimativa de taxas.
 */
final class FeeEstimateDTO
{
    public function __construct(
        public readonly float $requestedAmount,
        public readonly float $partnerFee,
        public readonly float $eulenFee,
        public readonly float $totalFee,
        public readonly float $totalDepix,
    ) {}

    /**
     * Cria DTO a partir da resposta JSON do microserviço.
     */
    public static function fromArray(array $data): self
    {
        $breakdown = $data['breakdown'];

        return new self(
            requestedAmount: $breakdown['requested_amount'],
            partnerFee: $breakdown['partner_fee'],
            eulenFee: $breakdown['eulen_fee'],
            totalFee: $breakdown['total_fee'],
            totalDepix: $breakdown['total_depix'],
        );
    }
}
