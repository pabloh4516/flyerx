<?php

declare(strict_types=1);

namespace App\Application\Audit\Listeners;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;
use App\Domain\Identity\Events\UserEmailVerified;

final readonly class AuditUserEmailVerified
{
    public function __construct(
        private AuditService $auditService,
    ) {}

    public function handle(UserEmailVerified $event): void
    {
        $context = AuditContext::fromRequest()
            ->withUser($event->getAggregateId());

        $this->auditService->log(
            action: AuditAction::USER_EMAIL_VERIFIED,
            entityType: 'User',
            entityId: $event->getAggregateId(),
            oldData: ['email_verified_at' => null],
            newData: ['email_verified_at' => $event->getOccurredAt()->format(\DateTimeInterface::ATOM)],
            metadata: [
                'event_id' => $event->getEventId(),
            ],
            context: $context,
        );
    }
}
