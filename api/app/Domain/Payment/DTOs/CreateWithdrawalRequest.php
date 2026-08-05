<?php

declare(strict_types=1);

namespace App\Domain\Payment\DTOs;

final readonly class CreateWithdrawalRequest
{
    public function __construct(
        public string $idempotencyKey,
        public float $amount,
        public string $pixKeyType,
        public string $pixKey,
        public string $currency = 'BRL',
        public ?string $recipientName = null,
        public ?string $recipientDocument = null,
        public ?string $description = null,
        public array $metadata = [],
    ) {}
}
