<?php

declare(strict_types=1);

namespace App\Domain\Identity\Exceptions;

use DomainException;

final class TwoFactorRequiredException extends DomainException
{
    public function __construct(
        public readonly string $sessionToken,
        string $message = 'Two-factor authentication required'
    ) {
        parent::__construct($message);
    }

    public function getSessionToken(): string
    {
        return $this->sessionToken;
    }

    public function getToken(): string
    {
        return $this->sessionToken;
    }
}
