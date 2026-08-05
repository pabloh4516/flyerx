<?php

declare(strict_types=1);

namespace App\Domain\Identity\Exceptions;

use DomainException;

final class WeakPasswordException extends DomainException
{
    public function __construct(string $message = 'Password does not meet security requirements')
    {
        parent::__construct($message);
    }
}
