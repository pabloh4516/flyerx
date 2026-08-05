<?php

declare(strict_types=1);

namespace App\Domain\Identity\Exceptions;

use DomainException;

final class InvalidTaxNumberException extends DomainException
{
    public function __construct(string $message = 'Invalid tax number (CPF/CNPJ)')
    {
        parent::__construct($message);
    }
}
