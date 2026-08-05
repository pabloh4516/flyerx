<?php

declare(strict_types=1);

namespace App\Domain\Shared;

use App\Domain\Shared\Contracts\DomainEventInterface;
use DateTimeImmutable;
use Ramsey\Uuid\Uuid;

abstract class DomainEvent implements DomainEventInterface
{
    private readonly string $eventId;
    private readonly DateTimeImmutable $occurredAt;

    public function __construct(
        private readonly string $aggregateId
    ) {
        $this->eventId = Uuid::uuid4()->toString();
        $this->occurredAt = new DateTimeImmutable();
    }

    public function getEventId(): string
    {
        return $this->eventId;
    }

    public function getAggregateId(): string
    {
        return $this->aggregateId;
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    abstract public function toArray(): array;
}
