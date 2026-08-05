<?php

declare(strict_types=1);

namespace App\Application\Audit\Listeners;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;
use App\Domain\Wallet\Events\WalletSuspended;

final readonly class AuditWalletSuspended
{
    public function __construct(
        private AuditService $auditService,
    ) {}

    public function handle(WalletSuspended $event): void
    {
        $context = AuditContext::fromRequest();

        $this->auditService->log(
            action: AuditAction::WALLET_SUSPENDED,
            entityType: 'Wallet',
            entityId: $event->getAggregateId(),
            oldData: ['status' => 'active'],
            newData: [
                'status' => 'suspended',
                'suspended_at' => $event->getOccurredAt()->format(\DateTimeInterface::ATOM),
                'suspension_reason' => $event->reason,
            ],
            metadata: [
                'event_id' => $event->getEventId(),
                'security_alert' => true,
                'requires_review' => true,
                'suspension_reason' => $event->reason,
            ],
            context: $context,
        );
    }
}
