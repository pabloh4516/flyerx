<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Exceptions;

use DomainException;

final class InsufficientBalanceException extends DomainException
{
    public function __construct(
        private readonly string $required,
        private readonly string $available,
        string $message = 'Insufficient balance'
    ) {
        parent::__construct($message);
    }

    public function getRequired(): string
    {
        return $this->required;
    }

    public function getAvailable(): string
    {
        return $this->available;
    }
}
