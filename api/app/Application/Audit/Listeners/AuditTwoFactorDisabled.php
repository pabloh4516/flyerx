<?php

declare(strict_types=1);

namespace App\Application\Audit\Listeners;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;
use App\Domain\Identity\Events\TwoFactorDisabled;

final readonly class AuditTwoFactorDisabled
{
    public function __construct(
        private AuditService $auditService,
    ) {}

    public function handle(TwoFactorDisabled $event): void
    {
        $context = AuditContext::fromRequest()
            ->withUser($event->getAggregateId());

        $this->auditService->log(
            action: AuditAction::TWO_FACTOR_DISABLED,
            entityType: 'User',
            entityId: $event->getAggregateId(),
            oldData: ['two_factor_enabled' => true],
            newData: ['two_factor_enabled' => false],
            metadata: [
                'event_id' => $event->getEventId(),
                'security_alert' => true,
                'requires_review' => true,
            ],
            context: $context,
        );
    }
}
