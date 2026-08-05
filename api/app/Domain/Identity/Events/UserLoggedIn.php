<?php

declare(strict_types=1);

namespace App\Domain\Identity\Events;

use App\Domain\Shared\DomainEvent;

final class UserLoggedIn extends DomainEvent
{
    public function __construct(
        string $userId,
        private readonly string $ipAddress,
        private readonly ?string $userAgent = null,
        private readonly ?string $sessionId = null,
    ) {
        parent::__construct($userId);
    }

    public function getIpAddress(): string
    {
        return $this->ipAddress;
    }

    public function getUserAgent(): ?string
    {
        return $this->userAgent;
    }

    public function getSessionId(): ?string
    {
        return $this->sessionId;
    }

    public function toArray(): array
    {
        return [
            'event_id' => $this->getEventId(),
            'user_id' => $this->getAggregateId(),
            'ip_address' => $this->ipAddress,
            'user_agent' => $this->userAgent,
            'session_id' => $this->sessionId,
            'occurred_at' => $this->getOccurredAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
