<?php

declare(strict_types=1);

namespace App\Domain\Identity\Events;

use App\Domain\Shared\DomainEvent;

final class UserKycUpdated extends DomainEvent
{
    public function __construct(
        string $userId,
        private readonly array $kycData = []
    ) {
        parent::__construct($userId);
    }

    public function getKycData(): array
    {
        return $this->kycData;
    }

    public function toArray(): array
    {
        return [
            'event_id' => $this->getEventId(),
            'user_id' => $this->getAggregateId(),
            'kyc_data' => $this->kycData,
            'occurred_at' => $this->getOccurredAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
