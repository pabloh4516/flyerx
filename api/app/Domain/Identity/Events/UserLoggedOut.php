<?php

declare(strict_types=1);

namespace App\Domain\Identity\Events;

use App\Domain\Shared\DomainEvent;

final class UserLoggedOut extends DomainEvent
{
    public function __construct(
        string $userId,
        private readonly ?string $sessionId = null,
        private readonly string $reason = 'user_initiated',
    ) {
        parent::__construct($userId);
    }

    public function getSessionId(): ?string
    {
        return $this->sessionId;
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
            'session_id' => $this->sessionId,
            'reason' => $this->reason,
            'occurred_at' => $this->getOccurredAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
