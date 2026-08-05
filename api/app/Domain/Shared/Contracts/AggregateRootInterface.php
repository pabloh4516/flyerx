<?php

declare(strict_types=1);

namespace App\Domain\Shared\Contracts;

interface AggregateRootInterface extends EntityInterface
{
    /**
     * @return array<DomainEventInterface>
     */
    public function pullDomainEvents(): array;

    public function recordDomainEvent(DomainEventInterface $event): void;
}
