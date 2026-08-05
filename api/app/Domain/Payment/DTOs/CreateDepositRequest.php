<?php

declare(strict_types=1);

namespace App\Domain\Payment\DTOs;

final readonly class CreateDepositRequest
{
    public function __construct(
        public string $idempotencyKey,
        public float $amount,
        public string $currency = 'BRL',
        public ?string $description = null,
        public ?int $expirationMinutes = null,
        public array $metadata = [],
    ) {}
}
