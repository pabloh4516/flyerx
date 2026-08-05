<?php

declare(strict_types=1);

namespace App\Domain\Identity\Exceptions;

use DateTimeInterface;
use DomainException;

final class UserBlockedException extends DomainException
{
    public function __construct(
        public readonly ?DateTimeInterface $blockedUntil = null,
        string $message = 'User account is blocked'
    ) {
        parent::__construct($message);
    }

    public function getBlockedUntil(): ?DateTimeInterface
    {
        return $this->blockedUntil;
    }
}
