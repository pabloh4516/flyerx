<?php

declare(strict_types=1);

namespace App\Application\Audit\Listeners;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;
use App\Domain\Identity\Events\UserRegistered;

final readonly class AuditUserRegistered
{
    public function __construct(
        private AuditService $auditService,
    ) {}

    public function handle(UserRegistered $event): void
    {
        $context = AuditContext::fromRequest()
            ->withUser($event->getAggregateId());

        $this->auditService->log(
            action: AuditAction::USER_REGISTERED,
            entityType: 'User',
            entityId: $event->getAggregateId(),
            oldData: null,
            newData: $this->sanitizeUserData($event->getUserData()),
            metadata: [
                'event_id' => $event->getEventId(),
                'registration_source' => 'api',
            ],
            context: $context,
        );
    }

    /**
     * Remove sensitive data from user registration data.
     */
    private function sanitizeUserData(array $userData): array
    {
        // Remove password-related fields
        unset(
            $userData['password'],
            $userData['password_confirmation'],
            $userData['password_hash']
        );

        return $userData;
    }
}
