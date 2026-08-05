<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Enums;

enum TransactionType: string
{
    case DEPOSIT = 'deposit';
    case WITHDRAWAL = 'withdrawal';
    case TRANSFER_IN = 'transfer_in';
    case TRANSFER_OUT = 'transfer_out';
    case FEE = 'fee';
    case REFUND = 'refund';
    case ADJUSTMENT = 'adjustment';

    public function isCredit(): bool
    {
        return in_array($this, [
            self::DEPOSIT,
            self::TRANSFER_IN,
            self::REFUND,
        ]);
    }

    public function isDebit(): bool
    {
        return in_array($this, [
            self::WITHDRAWAL,
            self::TRANSFER_OUT,
            self::FEE,
        ]);
    }

    public function label(): string
    {
        return match ($this) {
            self::DEPOSIT => 'Depósito',
            self::WITHDRAWAL => 'Saque',
            self::TRANSFER_IN => 'Transferência Recebida',
            self::TRANSFER_OUT => 'Transferência Enviada',
            self::FEE => 'Taxa',
            self::REFUND => 'Reembolso',
            self::ADJUSTMENT => 'Ajuste',
        };
    }
}
