<?php

declare(strict_types=1);

namespace App\Application\Audit\Listeners;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;
use App\Domain\Identity\Events\UserLoginFailed;

final readonly class AuditUserLoginFailed
{
    public function __construct(
        private AuditService $auditService,
    ) {}

    public function handle(UserLoginFailed $event): void
    {
        $context = new AuditContext(
            ipAddress: $event->getIpAddress(),
            userAgent: $event->getUserAgent(),
            requestId: request()->header('X-Request-ID'),
            sessionId: null,
            userId: $event->getAggregateId() !== 'unknown' ? $event->getAggregateId() : null,
            actorType: 'anonymous',
        );

        $this->auditService->log(
            action: AuditAction::USER_LOGIN_FAILED,
            entityType: 'User',
            entityId: $event->getAggregateId() !== 'unknown' ? $event->getAggregateId() : null,
            oldData: null,
            newData: [
                'attempted_at' => $event->getOccurredAt()->format(\DateTimeInterface::ATOM),
                'email_attempted' => $this->maskEmail($event->getEmail()),
            ],
            metadata: [
                'event_id' => $event->getEventId(),
                'reason' => $event->getReason(),
                'ip_address' => $event->getIpAddress(),
                'security_alert' => true,
            ],
            context: $context,
        );
    }

    /**
     * Mask email for privacy while keeping it identifiable.
     */
    private function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return '***@***';
        }

        $local = $parts[0];
        $domain = $parts[1];

        $maskedLocal = substr($local, 0, 2) . str_repeat('*', max(0, strlen($local) - 2));

        return $maskedLocal . '@' . $domain;
    }
}
