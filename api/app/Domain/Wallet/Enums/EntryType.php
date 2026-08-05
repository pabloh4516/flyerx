<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Enums;

enum EntryType: string
{
    case DEBIT = 'debit';
    case CREDIT = 'credit';

    public function opposite(): self
    {
        return match ($this) {
            self::DEBIT => self::CREDIT,
            self::CREDIT => self::DEBIT,
        };
    }
}
