<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Exceptions;

use DomainException;

final class WithdrawalLimitExceededException extends DomainException
{
    public function __construct(
        private readonly string $limitType, // daily, monthly
        private readonly string $limitAmount,
        ?string $message = null
    ) {
        $typeLabel = $limitType === 'daily' ? 'diário' : 'mensal';
        parent::__construct($message ?? "Limite {$typeLabel} de saque excedido. Limite: R$ {$limitAmount}");
    }

    public function getLimitType(): string
    {
        return $this->limitType;
    }

    public function getLimitAmount(): string
    {
        return $this->limitAmount;
    }
}
