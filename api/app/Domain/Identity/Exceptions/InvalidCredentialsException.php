<?php

declare(strict_types=1);

namespace App\Domain\Identity\Exceptions;

use DomainException;

final class InvalidCredentialsException extends DomainException
{
    public function __construct(string $message = 'Invalid credentials')
    {
        parent::__construct($message);
    }
}
