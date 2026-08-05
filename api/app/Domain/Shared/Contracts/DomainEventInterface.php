<?php

declare(strict_types=1);

namespace App\Domain\Shared\Contracts;

use DateTimeImmutable;

interface DomainEventInterface
{
    public function getEventId(): string;

    public function getAggregateId(): string;

    public function getOccurredAt(): DateTimeImmutable;

    public function toArray(): array;
}
