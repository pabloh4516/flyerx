<?php

declare(strict_types=1);

namespace App\Application\Audit\Listeners;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;
use App\Domain\Identity\Events\UserLoggedOut;

final readonly class AuditUserLoggedOut
{
    public function __construct(
        private AuditService $auditService,
    ) {}

    public function handle(UserLoggedOut $event): void
    {
        $context = AuditContext::fromRequest()
            ->withUser($event->getAggregateId())
            ->withSession($event->getSessionId() ?? '');

        $this->auditService->log(
            action: AuditAction::USER_LOGOUT,
            entityType: 'User',
            entityId: $event->getAggregateId(),
            oldData: null,
            newData: [
                'logged_out_at' => $event->getOccurredAt()->format(\DateTimeInterface::ATOM),
                'session_id' => $event->getSessionId(),
            ],
            metadata: [
                'event_id' => $event->getEventId(),
                'reason' => $event->getReason(),
            ],
            context: $context,
        );
    }
}
