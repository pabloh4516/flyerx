<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Enums;

enum WalletStatus: string
{
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case CLOSED = 'closed';

    public function canOperate(): bool
    {
        return $this === self::ACTIVE;
    }

    public function canDeposit(): bool
    {
        return $this === self::ACTIVE;
    }

    public function canWithdraw(): bool
    {
        return $this === self::ACTIVE;
    }
}
