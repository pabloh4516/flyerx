<?php

declare(strict_types=1);

namespace App\Application\Audit\Listeners;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;
use App\Domain\Identity\Events\TwoFactorEnabled;

final readonly class AuditTwoFactorEnabled
{
    public function __construct(
        private AuditService $auditService,
    ) {}

    public function handle(TwoFactorEnabled $event): void
    {
        $context = AuditContext::fromRequest()
            ->withUser($event->getAggregateId());

        $this->auditService->log(
            action: AuditAction::TWO_FACTOR_ENABLED,
            entityType: 'User',
            entityId: $event->getAggregateId(),
            oldData: ['two_factor_enabled' => false],
            newData: ['two_factor_enabled' => true],
            metadata: [
                'event_id' => $event->getEventId(),
                'security_improvement' => true,
            ],
            context: $context,
        );
    }
}
