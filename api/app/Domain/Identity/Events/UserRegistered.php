<?php

declare(strict_types=1);

namespace App\Domain\Identity\Events;

use App\Domain\Shared\DomainEvent;

final class UserRegistered extends DomainEvent
{
    public function __construct(
        string $userId,
        private readonly array $userData = []
    ) {
        parent::__construct($userId);
    }

    public function getUserData(): array
    {
        return $this->userData;
    }

    public function toArray(): array
    {
        return [
            'event_id' => $this->getEventId(),
            'user_id' => $this->getAggregateId(),
            'user_data' => $this->userData,
            'occurred_at' => $this->getOccurredAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
