<?php

declare(strict_types=1);

namespace App\Domain\Identity\Exceptions;

use DomainException;

final class InvalidEmailException extends DomainException
{
    public function __construct(string $message = 'Invalid email address')
    {
        parent::__construct($message);
    }
}
