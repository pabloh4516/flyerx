<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Events;

use App\Domain\Shared\DomainEvent;

final class WithdrawalCreated extends DomainEvent
{
    public function toArray(): array
    {
        return [
            'event_id' => $this->getEventId(),
            'aggregate_id' => $this->getAggregateId(),
            'occurred_at' => $this->getOccurredAt()->format('c'),
        ];
    }
}
