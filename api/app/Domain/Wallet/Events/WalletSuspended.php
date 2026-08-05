<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Events;

use App\Domain\Shared\DomainEvent;

final class WalletSuspended extends DomainEvent
{
    public function __construct(
        string $aggregateId,
        public readonly string $reason
    ) {
        parent::__construct($aggregateId);
    }

    public function toArray(): array
    {
        return [
            'event_id' => $this->getEventId(),
            'aggregate_id' => $this->getAggregateId(),
            'occurred_at' => $this->getOccurredAt()->format('c'),
            'reason' => $this->reason,
        ];
    }
}
