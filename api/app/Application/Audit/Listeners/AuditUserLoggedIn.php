<?php

declare(strict_types=1);

namespace App\Application\Audit\Listeners;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;
use App\Domain\Identity\Events\UserLoggedIn;

final readonly class AuditUserLoggedIn
{
    public function __construct(
        private AuditService $auditService,
    ) {}

    public function handle(UserLoggedIn $event): void
    {
        $context = new AuditContext(
            ipAddress: $event->getIpAddress(),
            userAgent: $event->getUserAgent(),
            requestId: request()->header('X-Request-ID'),
            sessionId: $event->getSessionId(),
            userId: $event->getAggregateId(),
            actorType: 'user',
        );

        $this->auditService->log(
            action: AuditAction::USER_LOGIN,
            entityType: 'User',
            entityId: $event->getAggregateId(),
            oldData: null,
            newData: [
                'logged_in_at' => $event->getOccurredAt()->format(\DateTimeInterface::ATOM),
                'session_id' => $event->getSessionId(),
            ],
            metadata: [
                'event_id' => $event->getEventId(),
                'ip_address' => $event->getIpAddress(),
            ],
            context: $context,
        );
    }
}
