<?php

declare(strict_types=1);

namespace App\Application\Wallet\DTOs;

final readonly class CreateDepositDTO
{
    public function __construct(
        public string $walletId,
        public float $amount,
        public string $idempotencyKey,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            walletId: $data['wallet_id'],
            amount: (float) $data['amount'],
            idempotencyKey: $data['idempotency_key'],
        );
    }
}
