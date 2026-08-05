<?php

declare(strict_types=1);

namespace App\Application\Audit\Listeners;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;
use App\Domain\Wallet\Events\DepositFailed;

final readonly class AuditDepositFailed
{
    public function __construct(
        private AuditService $auditService,
    ) {}

    public function handle(DepositFailed $event): void
    {
        // Failures may come from webhooks or internal processes
        $context = $this->resolveContext();

        $this->auditService->log(
            action: AuditAction::DEPOSIT_FAILED,
            entityType: 'Deposit',
            entityId: $event->getAggregateId(),
            oldData: ['status' => 'pending'],
            newData: [
                'status' => 'failed',
                'failed_at' => $event->getOccurredAt()->format(\DateTimeInterface::ATOM),
                'failure_reason' => $event->reason,
            ],
            metadata: [
                'event_id' => $event->getEventId(),
                'financial_operation' => true,
                'requires_investigation' => true,
                'failure_reason' => $event->reason,
            ],
            context: $context,
        );
    }

    private function resolveContext(): AuditContext
    {
        $userAgent = request()->userAgent() ?? '';

        if (str_contains($userAgent, 'webhook') || str_contains($userAgent, 'callback')) {
            return AuditContext::provider('payment_provider', request()->ip());
        }

        return AuditContext::fromRequest();
    }
}
