<?php

declare(strict_types=1);

namespace App\Application\Audit\Listeners;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;
use App\Domain\Identity\Events\PasswordChanged;

final readonly class AuditPasswordChanged
{
    public function __construct(
        private AuditService $auditService,
    ) {}

    public function handle(PasswordChanged $event): void
    {
        $context = AuditContext::fromRequest()
            ->withUser($event->getAggregateId());

        $this->auditService->log(
            action: AuditAction::USER_PASSWORD_CHANGED,
            entityType: 'User',
            entityId: $event->getAggregateId(),
            oldData: null, // Never log password data
            newData: ['password_changed_at' => $event->getOccurredAt()->format(\DateTimeInterface::ATOM)],
            metadata: [
                'event_id' => $event->getEventId(),
                'security_alert' => true,
            ],
            context: $context,
        );
    }
}
