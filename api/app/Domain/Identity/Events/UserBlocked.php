<?php

declare(strict_types=1);

namespace App\Domain\Identity\Events;

use App\Domain\Shared\DomainEvent;

final class UserBlocked extends DomainEvent
{
    public function __construct(
        string $userId,
        private readonly string $reason
    ) {
        parent::__construct($userId);
    }

    public function getReason(): string
    {
        return $this->reason;
    }

    public function toArray(): array
    {
        return [
            'event_id' => $this->getEventId(),
            'user_id' => $this->getAggregateId(),
            'reason' => $this->reason,
            'occurred_at' => $this->getOccurredAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
