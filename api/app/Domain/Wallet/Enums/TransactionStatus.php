<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Enums;

enum TransactionStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';
    case FAILED = 'failed';
    case CANCELLED = 'cancelled';
    case REVERSED = 'reversed';

    public function isFinal(): bool
    {
        return in_array($this, [
            self::COMPLETED,
            self::FAILED,
            self::CANCELLED,
            self::REVERSED,
        ]);
    }

    public function isSuccessful(): bool
    {
        return $this === self::COMPLETED;
    }

    public function canTransitionTo(self $newStatus): bool
    {
        return match ($this) {
            self::PENDING => in_array($newStatus, [
                self::PROCESSING,
                self::COMPLETED,
                self::FAILED,
                self::CANCELLED,
            ]),
            self::PROCESSING => in_array($newStatus, [
                self::COMPLETED,
                self::FAILED,
            ]),
            self::COMPLETED => $newStatus === self::REVERSED,
            default => false,
        };
    }
}
