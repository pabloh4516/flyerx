<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Exceptions;

use DomainException;

final class DuplicateOperationException extends DomainException
{
    public function __construct(
        public readonly string $idempotencyKey,
        string $message = 'Operation already processed'
    ) {
        parent::__construct($message);
    }
}
