<?php

declare(strict_types=1);

namespace App\Application\Audit\Listeners;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;
use App\Domain\Wallet\Events\DepositCompleted;

final readonly class AuditDepositCompleted
{
    public function __construct(
        private AuditService $auditService,
    ) {}

    public function handle(DepositCompleted $event): void
    {
        // Deposits completed via webhook may not have request context
        $context = $this->resolveContext();

        $this->auditService->log(
            action: AuditAction::DEPOSIT_COMPLETED,
            entityType: 'Deposit',
            entityId: $event->getAggregateId(),
            oldData: ['status' => 'pending'],
            newData: [
                'status' => 'completed',
                'completed_at' => $event->getOccurredAt()->format(\DateTimeInterface::ATOM),
            ],
            metadata: [
                'event_id' => $event->getEventId(),
                'financial_operation' => true,
            ],
            context: $context,
        );
    }

    private function resolveContext(): AuditContext
    {
        // Check if this is coming from a webhook/provider callback
        $userAgent = request()->userAgent() ?? '';

        if (str_contains($userAgent, 'webhook') || str_contains($userAgent, 'callback')) {
            return AuditContext::provider('payment_provider', request()->ip());
        }

        return AuditContext::fromRequest();
    }
}
