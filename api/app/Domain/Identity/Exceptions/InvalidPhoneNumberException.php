<?php

declare(strict_types=1);

namespace App\Domain\Identity\Exceptions;

use DomainException;

final class InvalidPhoneNumberException extends DomainException
{
    public function __construct(string $message = 'Invalid phone number')
    {
        parent::__construct($message);
    }
}
