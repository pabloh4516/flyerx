<?php

declare(strict_types=1);

namespace App\Domain\Payment\DTOs;

use DateTimeImmutable;

final readonly class DepositStatusResponse
{
    public function __construct(
        public bool $success,
        public ?string $providerId,
        public ?string $status,
        public ?float $amount,
        public ?float $paidAmount,
        public ?DateTimeImmutable $paidAt,
        public ?string $errorCode = null,
        public ?string $errorMessage = null,
        public array $rawResponse = [],
    ) {}

    public static function success(
        string $providerId,
        string $status,
        float $amount,
        ?float $paidAmount = null,
        ?DateTimeImmutable $paidAt = null,
        array $rawResponse = []
    ): self {
        return new self(
            success: true,
            providerId: $providerId,
            status: $status,
            amount: $amount,
            paidAmount: $paidAmount,
            paidAt: $paidAt,
            rawResponse: $rawResponse,
        );
    }

    public static function failure(
        string $errorCode,
        string $errorMessage,
        array $rawResponse = []
    ): self {
        return new self(
            success: false,
            providerId: null,
            status: null,
            amount: null,
            paidAmount: null,
            paidAt: null,
            errorCode: $errorCode,
            errorMessage: $errorMessage,
            rawResponse: $rawResponse,
        );
    }

    public function isPaid(): bool
    {
        return in_array($this->status, ['paid', 'completed', 'confirmed']);
    }

    public function isExpired(): bool
    {
        return in_array($this->status, ['expired', 'timeout']);
    }

    public function isFailed(): bool
    {
        return in_array($this->status, ['failed', 'error', 'cancelled']);
    }
}
