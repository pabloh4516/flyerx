<?php

declare(strict_types=1);

namespace App\Domain\Identity\Events;

use App\Domain\Shared\DomainEvent;

final class UserLoginFailed extends DomainEvent
{
    public function __construct(
        string $userId,
        private readonly string $email,
        private readonly string $ipAddress,
        private readonly string $reason,
        private readonly ?string $userAgent = null,
    ) {
        parent::__construct($userId);
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getIpAddress(): string
    {
        return $this->ipAddress;
    }

    public function getReason(): string
    {
        return $this->reason;
    }

    public function getUserAgent(): ?string
    {
        return $this->userAgent;
    }

    public function toArray(): array
    {
        return [
            'event_id' => $this->getEventId(),
            'user_id' => $this->getAggregateId(),
            'email' => $this->email,
            'ip_address' => $this->ipAddress,
            'reason' => $this->reason,
            'user_agent' => $this->userAgent,
            'occurred_at' => $this->getOccurredAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
