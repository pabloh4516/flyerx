<?php

declare(strict_types=1);

namespace App\Domain\Shared;

use App\Domain\Shared\Contracts\AggregateRootInterface;
use App\Domain\Shared\Contracts\DomainEventInterface;

abstract class AggregateRoot extends Entity implements AggregateRootInterface
{
    /** @var array<DomainEventInterface> */
    private array $domainEvents = [];

    public function pullDomainEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];

        return $events;
    }

    public function recordDomainEvent(DomainEventInterface $event): void
    {
        $this->domainEvents[] = $event;
    }
}
