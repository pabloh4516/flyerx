<?php

declare(strict_types=1);

namespace App\Domain\Payment\DTOs;

use DateTimeImmutable;

final readonly class WithdrawalStatusResponse
{
    public function __construct(
        public bool $success,
        public ?string $providerId,
        public ?string $status,
        public ?float $amount,
        public ?string $endToEndId,
        public ?DateTimeImmutable $completedAt,
        public ?string $errorCode = null,
        public ?string $errorMessage = null,
        public array $rawResponse = [],
    ) {}

    public static function success(
        string $providerId,
        string $status,
        float $amount,
        ?string $endToEndId = null,
        ?DateTimeImmutable $completedAt = null,
        array $rawResponse = []
    ): self {
        return new self(
            success: true,
            providerId: $providerId,
            status: $status,
            amount: $amount,
            endToEndId: $endToEndId,
            completedAt: $completedAt,
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
            endToEndId: null,
            completedAt: null,
            errorCode: $errorCode,
            errorMessage: $errorMessage,
            rawResponse: $rawResponse,
        );
    }

    public function isCompleted(): bool
    {
        return in_array($this->status, ['completed', 'paid', 'confirmed']);
    }

    public function isFailed(): bool
    {
        return in_array($this->status, ['failed', 'error', 'rejected', 'cancelled']);
    }

    public function isPending(): bool
    {
        return in_array($this->status, ['pending', 'processing', 'in_progress']);
    }
}
