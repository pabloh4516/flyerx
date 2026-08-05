<?php

declare(strict_types=1);

namespace App\Application\Audit\Listeners;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;
use App\Domain\Wallet\Events\WalletCreated;

final readonly class AuditWalletCreated
{
    public function __construct(
        private AuditService $auditService,
    ) {}

    public function handle(WalletCreated $event): void
    {
        $context = AuditContext::fromRequest();

        $this->auditService->log(
            action: AuditAction::WALLET_CREATED,
            entityType: 'Wallet',
            entityId: $event->getAggregateId(),
            oldData: null,
            newData: [
                'status' => 'active',
                'created_at' => $event->getOccurredAt()->format(\DateTimeInterface::ATOM),
            ],
            metadata: [
                'event_id' => $event->getEventId(),
            ],
            context: $context,
        );
    }
}
