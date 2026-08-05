<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Enums;

enum DepositStatus: string
{
    case PENDING = 'pending';
    case AWAITING_PAYMENT = 'awaiting_payment';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';
    case FAILED = 'failed';
    case EXPIRED = 'expired';
    case CANCELLED = 'cancelled';

    public function isFinal(): bool
    {
        return in_array($this, [
            self::COMPLETED,
            self::FAILED,
            self::EXPIRED,
            self::CANCELLED,
        ]);
    }

    public function isSuccessful(): bool
    {
        return $this === self::COMPLETED;
    }

    public function isPending(): bool
    {
        return in_array($this, [
            self::PENDING,
            self::AWAITING_PAYMENT,
            self::PROCESSING,
        ]);
    }
}
