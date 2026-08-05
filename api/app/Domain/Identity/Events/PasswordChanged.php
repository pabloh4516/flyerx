<?php

declare(strict_types=1);

namespace App\Domain\Identity\Events;

use App\Domain\Shared\DomainEvent;

final class PasswordChanged extends DomainEvent
{
    public function toArray(): array
    {
        return [
            'event_id' => $this->getEventId(),
            'user_id' => $this->getAggregateId(),
            'occurred_at' => $this->getOccurredAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
