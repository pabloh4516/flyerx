<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Enums;

enum AccountType: string
{
    case ASSET = 'asset';
    case LIABILITY = 'liability';
    case EQUITY = 'equity';
    case REVENUE = 'revenue';
    case EXPENSE = 'expense';

    public function normalBalance(): string
    {
        return match ($this) {
            self::ASSET, self::EXPENSE => 'debit',
            self::LIABILITY, self::EQUITY, self::REVENUE => 'credit',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::ASSET => 'Ativo',
            self::LIABILITY => 'Passivo',
            self::EQUITY => 'Patrimônio',
            self::REVENUE => 'Receita',
            self::EXPENSE => 'Despesa',
        };
    }
}
