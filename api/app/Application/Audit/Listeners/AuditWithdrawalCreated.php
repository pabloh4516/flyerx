<?php

declare(strict_types=1);

namespace App\Application\Audit\Listeners;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;
use App\Domain\Wallet\Events\WithdrawalCreated;

final readonly class AuditWithdrawalCreated
{
    public function __construct(
        private AuditService $auditService,
    ) {}

    public function handle(WithdrawalCreated $event): void
    {
        $context = AuditContext::fromRequest();

        $this->auditService->log(
            action: AuditAction::WITHDRAWAL_CREATED,
            entityType: 'Withdrawal',
            entityId: $event->getAggregateId(),
            oldData: null,
            newData: [
                'status' => 'pending',
                'created_at' => $event->getOccurredAt()->format(\DateTimeInterface::ATOM),
            ],
            metadata: [
                'event_id' => $event->getEventId(),
                'financial_operation' => true,
                'high_risk_operation' => true,
            ],
            context: $context,
        );
    }
}
