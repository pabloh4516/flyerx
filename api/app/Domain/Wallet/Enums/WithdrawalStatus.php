<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Enums;

enum WithdrawalStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';
    case FAILED = 'failed';
    case CANCELLED = 'cancelled';
    case REJECTED = 'rejected';

    public function isFinal(): bool
    {
        return in_array($this, [
            self::COMPLETED,
            self::FAILED,
            self::CANCELLED,
            self::REJECTED,
        ]);
    }

    public function isSuccessful(): bool
    {
        return $this === self::COMPLETED;
    }

    public function requiresApproval(): bool
    {
        return $this === self::PENDING;
    }

    public function canProcess(): bool
    {
        return $this === self::APPROVED;
    }
}
